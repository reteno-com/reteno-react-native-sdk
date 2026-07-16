# Reteno React Native SDK Improvement Roadmap

A code-level review of the 11-point plan: what is flawless, where the hidden pitfalls are,
and the order in which this is realistically done.

- **Scope:** RN layer only — JS/TS + our native bridge in this repo.
- **Excluded:** anything requiring changes to the external native Reteno SDK.
- **Baseline:** v2.1.1

---

## Three key findings

### 01 — correctness: iOS permission getters lie about state

`getNotificationPermissionStatus()` on iOS returns a hardcoded `'ALLOWED'`, and
`requestNotificationPermission()` → `false`. Therefore the rule for unifying unsupported
methods must split in two:

- **fire-and-forget commands** (no meaningful return) → no-op `Promise.resolve()`;
- **methods returning state/result** → an honest result or `reject`, but **never** a fake value.
  Note `requestNotificationPermission()` is formally a command but returns a meaningful boolean —
  so `false` on iOS is a fake result too, and it belongs in this second bucket.

**Scope split (avoids conflict with the Excluded list below):**

- _Excluded_ — a **Reteno-native** permission API (opt-in/opt-out driven by the native SDK).
- _In scope_ — **honest wrapper behavior**: either keep these methods Android-only and on iOS
  `reject(new Error('Unsupported on iOS'))`, **or** implement a real iOS permission read in our
  own bridge via `UNUserNotificationCenter.getNotificationSettings()`. The second option is
  native-bridge work in _this_ repo, independent of the external Reteno iOS SDK.

### 02 — segmentation: `add/removeEventListener` = implicitly EventManager

Removing a listener by callback reference is not possible "for free": RN emitters do not
remove by function identity through the `DeviceEventEmitter` path. A registry is required — and
that is the EventManager (item 6). So items 3 and 4 are not a "small wrapper" — they must be
promoted into a separate batch.

**Design decision — recommended:** forbid duplicate `(event, callback)` pairs (a second `add`
of the same pair is a no-op). Since `removeEventListener(event, cb)` has no subscription handle,
allowing duplicates makes removal ambiguous ("which one?"). Forbidding them keeps the API
obvious: one pair → one subscription → one deterministic `remove`. Otherwise this is unclear:

```ts
Reteno.addEventListener('pushReceived', cb);
Reteno.addEventListener('pushReceived', cb); // two? one? no-op?
Reteno.removeEventListener('pushReceived', cb); // removes which?
```

### 03 — types: some types cannot be made "strict"

`getInitialNotification` returns the raw push payload with arbitrary keys, and
`getRecommendations` — its field set depends on the `fields` parameter. Both must be
permissive (index signature / generic), otherwise you break consumers.

`Record→unknown` is **potentially breaking for TypeScript consumers**, not absolutely — it
depends on the type's position. On **output** positions (data the SDK hands the consumer, read
without narrowing) it breaks compilation. On **pure input** positions (values the consumer
passes in) it is usually non-breaking — anything is assignable to `unknown` — though a
callback/input-style API can still break if the consumer reads a field before passing it on.
`reject`-instead-of-`throw` is a runtime behavior change. Neither belongs in a pure patch.

---

## Source of truth for types — native models + bridge mapping

The exact fields come from **three** sources, not one:

1. **iOS native model** — https://github.com/reteno-com/reteno-mobile-ios-sdk —
   `Recommendation`, `AppInboxMessage` structs, `UserNotificationService` payload,
   `LinkHandler`, action models.
2. **Android native model** — https://github.com/reteno-com/reteno-mobile-android-sdk —
   `Recommendation`, `AppInboxMessage`, `Interaction` / push data classes.
3. **Our bridge mapping** — `ios/RetenoSdk.swift`, `android/.../RetenoSdkModule.java`. The
   bridge decides what actually crosses to JS and under which name: a native field may be
   dropped, renamed, or reshaped during serialization. The native model alone is not enough.

The truth is the **bridge-forwarded common schema plus documented platform-specific optional
fields** — using the bridge's field names. Not a pure intersection (that would drop platform
extras); not a copy of one platform.

**Critical to cross-check both platforms simultaneously.** Where they diverge, the type
reflects this as optional rather than hiding it — e.g. `status` in inbox (`src/index.ts:200`)
is genuinely Android-only: the iOS native `AppInboxMessage` model has no equivalent field at
all, so there's nothing to forward.

**Concrete confirmation of this principle, found by checking the local `reteno-ios` /
`reteno-android` checkouts:** `category` was a _bridge gap_, not a native-model gap — both
native `AppInboxMessage` models (iOS `AppInboxMessage.swift`, Android `AppInboxMessage.kt`)
already had `category`, but our **iOS bridge** simply wasn't forwarding it
(`ios/RetenoSdk.swift`, `getAppInboxMessages`), even though the **Android bridge** was. This is
now fixed — iOS forwards `category` too — confirmed against the pod version actually pinned
and installed (`Reteno (2.7.2)` per `example/ios/Podfile.lock`), not just the local dev
checkout (which uses an unrelated build-number tagging scheme).

**Still open, deliberately not done as part of this:** both native models also have
`customData` (iOS: `[String: Any]?`, Android: `Map<String, String>?`), and **neither** bridge
forwards it. Closing this is a bigger step than closing the `category` gap — the value types
differ per platform, so the JS type needs to be permissive (`Record<string, unknown>`, per the
typing rule below) rather than a straight one-to-one mirror, and Android needs a
`Map<String, String>` → `WritableMap` conversion added to the bridge. Left as a follow-up, not
bundled into Batch 1.

That is, the "types" item in Batch 1 is a study of the native models and bridge mapping,
not "just write interfaces."

### Typing rule: "structured envelope + `Record<string, unknown>` for open content"

Not bare `unknown` everywhere, but not a fake structure over arbitrary data either. Split by
whether the field has a real fixed schema:

- **Fixed schema** (envelope) → real structure. `InAppCustomData` wrapper, inbox messages,
  `PushButton` action fields, recommendation items — their fields are known from native models
  - bridge mapping (`inapp_id`, `inapp_source`, `url`, `actionId`, `actionLink`, `id`, `title`…).
- **Genuinely arbitrary bag** → `Record<string, unknown>` + index signature. The contents of
  `InAppCustomData.customData`, the raw push payload (`userInfo`, `getInitialNotification`).
  Keys are set by a marketer in the dashboard / by the APNs–FCM envelope.

**Watch out — two unrelated fields share the name `customData`:** `InAppCustomData.customData`
is now `Record<string, unknown>` (tightened in Batch 1), but `PushButton.customData` is a
separate field, `string | null` (`src/index.ts:247`) — a raw, likely JSON-encoded string, not
an object. Decision made in Batch 1: `PushButton.customData` stays a raw string (not parsed),
documented with a JSDoc comment on the field rather than silently left ambiguous.

A fake structure over a truly arbitrary bag is **worse** than `unknown` — it lies (promises
fields that may be absent) and invites runtime errors. `unknown` is honest.

```ts
export type RetenoInAppCustomData = {
  inapp_id?: string;
  inapp_source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
  url?: string;
  customData?: Record<string, unknown>; // open bag — honestly unknown
};

export type RetenoPushPayload = {
  // only known Reteno keys (from native models + bridge mapping), e.g. es_notification_id?: string
  [key: string]: unknown;
};
```

You structure the **envelope**, not its arbitrary content. Note: this has the same semver
weight as `unknown` on output positions — the win is DX (autocomplete + safety), not the
version number.

---

## Point-by-point review

| #   | Topic               | Verdict    | Key point                                                                                                                                                                                                                                                        |
| --- | ------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Typing              | ⚠️ refine  | The small fixes are flawless. But `getInitial`/`getRecom` — permissive/generic; `Record→unknown` — _potentially_ breaking (output positions only).                                                                                                               |
| 2   | Promise consistency | ⚠️ caution | `reject` instead of `throw` — yes. "Always no-op resolve" is wrong for methods returning meaningful state/result → finding 01.                                                                                                                                   |
| 3   | Unified event API   | ✅ solid   | Direction is right, backward-compatible. But technically = item 6.                                                                                                                                                                                               |
| 4   | No-op subscription  | ✅ solid   | Shared type `RetenoSubscription{remove()}` + `__DEV__` warning: a fake subscription masks that the callback will never fire.                                                                                                                                     |
| 5   | Namespaces          | ✅ solid   | Facade over flat exports — low risk **if flat exports stay canonical** (docs risk: users may think flat API is deprecated). Metro has no tree-shaking — a "heavy" namespace is fine.                                                                             |
| 6   | EventManager        | ✅ solid   | Not a "small wrapper." Closing the `DeviceEventEmitter`/`NativeEventEmitter` split needs **Android bridge changes** (add `addListener`/`removeListeners` stubs — the module has no NativeEventEmitter contract today). Not external Reteno SDK, but not pure JS. |
| 7   | Event queue         | ✅ solid   | + `__DEV__` warning on drop (the 100 limit is silent). Parity is **not a JS unit test**: JS covers the public EventManager contract; drop-oldest/overflow + init-ordering need native/integration tests or manual QA.                                            |
| 8   | Tests               | ✅ solid   | Mock `NativeModules` + `Platform.OS`. Add LINKING_ERROR proxy, iOS getters after the fix.                                                                                                                                                                        |
| 9   | Docs / README       | ✅ solid   | Quick-start, typed examples, cleanup via `removeEventListener`, migration section.                                                                                                                                                                               |
| 10  | Tooling / CI        | ✅ solid   | + `npm run prepack` in CI (catches bob breakage). Drop `@types/react-native` — RN 0.78 ships types.                                                                                                                                                              |
| 11  | TurboModule spec    | ✅ solid   | Last. More than "add a spec": typed params. The event model is *not* different — see the verified note below. The legacy bridge can run through New Architecture interop → optimization, not correctness.                                                                                                |

---

## Roadmap — 5 batches, 2 releases

Batches 0–3 ship together as `2.2.0` from the current `2.1.1` baseline. This keeps the
public version aligned with the actual release plan: one minor release for infra, types,
EventManager, namespaces, and docs. Batch 4 remains a separate `3.0.0` major because it adds
the TurboModule/codegen migration surface.

**Correction (verified during the Batch 2 audit, superseding the original caveat below):**
TurboModules do **not** use a different event model. Checked directly against
`node_modules/react-native/src/private/specs/modules/NativeAppState.js` — an official,
already-migrated core RN module — its codegen `Spec` still declares plain
`+addListener: (eventName: string) => void` / `+removeListeners: (count: number) => void`,
and `AppState.js` still consumes it via a plain `new NativeEventEmitter(NativeAppState)`,
identical to the old-architecture pattern. So no interface abstraction around the event
source is needed for Batch 4 — the `addListener`/`removeListeners` stubs already added to
`RetenoSdkModule.java` in Batch 2 are exactly what a future codegen `Spec` will also require.
`addEventListener` calling `eventEmitter.addListener(...)` directly (`src/index.ts`) is fine
as shipped, no rework expected in Batch 4 for this.

### Batch 0 → included in `2.2.0` — Infra only

Infra still goes **first** in implementation order so local checks guard every subsequent step,
even though it ships in the same `2.2.0` release as Batches 1–3.

- [x] Fill `lefthook.yml` (pre-commit lint + typecheck) + `"prepare": "lefthook install"` so
      hooks are wired up automatically on `npm install`
- [x] Drop deprecated `@types/react-native` (RN 0.78 ships types) — **verified the emitted
      `.d.ts` in `lib/typescript` is byte-identical before/after** → confirmed patch, not minor
- [ ] **Backlog, not done:** GitHub Actions (lint / typecheck / test / `npm run prepack`, to
      catch bob breakage). A draft `.github/workflows/ci.yml` was prepared and verified locally
      (`npm ci` → lint → typecheck → test → prepack all green on a clean install) but deliberately
      held back — decide separately whether/when to turn on CI for this repo.

### Batch 1 → included in `2.2.0` — Types and correctness · `minor + changelog` (behavior changes)

Not "no breaking": the iOS permission-getter fix and `throw`→`reject` are runtime behavior
changes. Ship with a changelog note.

- Small types: `String[]→string[]`, merge payload types, typed push listeners
- Permissive/generic `getInitialNotification` and `getRecommendations` (fields from native models + bridge mapping)
- Structured envelope + `Record<string, unknown>` typing rule (see above) — **including event
  payload types**, so the type migration is not smeared across releases
- `reject` validation in `setUserAttributes` / `setMultiAccountUserAttributes`
- Fix the lying iOS permission getters — **recommended: honest `reject` on iOS first** (smaller
  blast radius). Defer the real `UNUserNotificationCenter` read to a separate PR so behavior
  cleanup is not mixed with new native-bridge logic.
  **Changelog must state explicitly:** _previously iOS returned fake values (`'ALLOWED'` /
  `false`); now it rejects as unsupported._
- JS tests on wrapper behavior (validation, platform branches, LINKING_ERROR proxy)

### Batch 2 → included in `2.2.0` — EventManager and unified event API · `minor + changelog`

- [x] EventManager with a subscription registry (item 6); duplicate `(event, callback)` pairs
      are deliberately a no-op and return the existing subscription. No interface abstraction
      around the event source needed — see the correction above; `addEventListener` calls
      `NativeEventEmitter` directly, matching how RN's own already-migrated TurboModules
      (e.g. `AppState`) do it
- [x] Android bridge: add `addListener` / `removeListeners` stubs so `NativeEventEmitter` works on
      both platforms (closes the `DeviceEventEmitter` split)
- [x] `addEventListener` / `removeEventListener` on top (item 3)
- [x] No-op subscription + shared type + `__DEV__` warning (item 4)
- [x] JS tests on the public EventManager contract

### Batch 3 → included in `2.2.0` — Namespaces and documentation · no breaking

- Facade `Reteno.user.*`, `Reteno.push.*`, `Reteno.inApp.*`, `Reteno.inbox.*`, `Reteno.ecommerce.*`
- **Flat exports remain canonical / backward-compatible for at least one major cycle** — the
  facade is additive, not a replacement
- README quick-start + typed examples + cleanup pattern
- Migration section: flat API → namespaced API

### Batch 4 → `3.0.0` — TurboModule / codegen spec · major

Staged migration to keep the step small:

1. Add `src/NativeRetenoSdk.ts` + `codegenConfig` **mirroring the existing bridge shape** —
   New Arch codegen wired, runtime mapping unchanged.
2. Then incrementally tighten `NSDictionary` / `ReadableMap` methods into typed structs.
3. Declare `addListener` / `removeListeners` in the codegen `Spec` (mirrors the Java stubs
   already added in Batch 2) — `src/index.ts`'s `NativeEventEmitter` usage does not change.
4. Native/integration tests + manual QA for queue overflow & init ordering (deferred from
   Batch 2).

---

**Excluded from scope** (requires native Reteno SDK changes): `logout`/clear identity,
consent/GDPR, push subscription opt-in/opt-out, client-side in-app triggers, a **Reteno-native**
unified permission API (symmetric opt-in/opt-out driven by the native SDK on both platforms).
This does _not_ cover making the existing wrapper honest — see the scope split under finding 01,
which stays in scope and ships in Batch 1.

**Strengths left untouched:** App Inbox, structured Ecommerce events, Recommendations,
anonymous/multi-account attributes.
