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
  native-bridge work in *this* repo, independent of the external Reteno iOS SDK.

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

**Critical to cross-check both platforms simultaneously.** Where they diverge (e.g.
`category`/`status` in inbox exist on Android only — already visible in `src/index.ts:183-185`),
the type reflects this as optional rather than hiding it.

That is, the "types" item in Batch 1 is a study of the native models and bridge mapping,
not "just write interfaces."

### Typing rule: "structured envelope + `Record<string, unknown>` for open content"

Not bare `unknown` everywhere, but not a fake structure over arbitrary data either. Split by
whether the field has a real fixed schema:

- **Fixed schema** (envelope) → real structure. `InAppCustomData` wrapper, inbox messages,
  `PushButton` action fields, recommendation items — their fields are known from native models
  + bridge mapping (`inapp_id`, `inapp_source`, `url`, `actionId`, `actionLink`, `id`, `title`…).
- **Genuinely arbitrary bag** → `Record<string, unknown>` + index signature. The contents of
  `InAppCustomData.customData`, the raw push payload (`userInfo`, `getInitialNotification`).
  Keys are set by a marketer in the dashboard / by the APNs–FCM envelope.

**Watch out — two unrelated fields share the name `customData`:** `InAppCustomData.customData`
is currently `Record<string, any>` (an object bag — tighten to `Record<string, unknown>`), but
`PushButton.customData` is currently `string | null` (`src/index.ts:200`) — a raw, likely
JSON-encoded string, not an object. Don't type both the same way; decide explicitly whether
`PushButton.customData` stays a raw string or gets parsed into a typed/`Record<string, unknown>`
shape before it reaches JS.

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

| # | Topic | Verdict | Key point |
|---|-------|---------|-----------|
| 1 | Typing | ⚠️ refine | The small fixes are flawless. But `getInitial`/`getRecom` — permissive/generic; `Record→unknown` — *potentially* breaking (output positions only). |
| 2 | Promise consistency | ⚠️ caution | `reject` instead of `throw` — yes. "Always no-op resolve" is wrong for methods returning meaningful state/result → finding 01. |
| 3 | Unified event API | ✅ solid | Direction is right, backward-compatible. But technically = item 6. |
| 4 | No-op subscription | ✅ solid | Shared type `RetenoSubscription{remove()}` + `__DEV__` warning: a fake subscription masks that the callback will never fire. |
| 5 | Namespaces | ✅ solid | Facade over flat exports — low risk **if flat exports stay canonical** (docs risk: users may think flat API is deprecated). Metro has no tree-shaking — a "heavy" namespace is fine. |
| 6 | EventManager | ✅ solid | Not a "small wrapper." Closing the `DeviceEventEmitter`/`NativeEventEmitter` split needs **Android bridge changes** (add `addListener`/`removeListeners` stubs — the module has no NativeEventEmitter contract today). Not external Reteno SDK, but not pure JS. |
| 7 | Event queue | ✅ solid | + `__DEV__` warning on drop (the 100 limit is silent). Parity is **not a JS unit test**: JS covers the public EventManager contract; drop-oldest/overflow + init-ordering need native/integration tests or manual QA. |
| 8 | Tests | ✅ solid | Mock `NativeModules` + `Platform.OS`. Add LINKING_ERROR proxy, iOS getters after the fix. |
| 9 | Docs / README | ✅ solid | Quick-start, typed examples, cleanup via `removeEventListener`, migration section. |
| 10 | Tooling / CI | ✅ solid | + `npm run prepack` in CI (catches bob breakage). Drop `@types/react-native` — RN 0.78 ships types. |
| 11 | TurboModule spec | ✅ solid | Last. More than "add a spec": typed params + a different event model. The legacy bridge can run through New Architecture interop → optimization, not correctness. |

---

## Roadmap — 5 batches, 5 releases

Each batch ships as its own release. Smaller blast radius, faster value to users, easier to
bisect regressions.

**One caveat that removes double work:** design the EventManager (Batch 2) with the
TurboModule event model in mind — abstract the event source behind an interface — even though
it ships on the old `RCTEventEmitter` first. Otherwise the event layer gets partially rewritten
again in Batch 4.

### Batch 0 → `2.1.2` — Infra only · patch if package output is unchanged, otherwise minor

Infra goes **first** so CI gates every subsequent PR — not bundled into the "low risk" release.

- Fill `lefthook.yml` (pre-commit lint + typecheck)
- GitHub Actions: lint / typecheck / test / `npm run prepack` (catches bob breakage)
- Drop deprecated `@types/react-native` (RN 0.78 ships types) — **verify the emitted `.d.ts`
  in `lib/typescript` is unchanged**; if the declaration output shifts, bump minor, not patch

### Batch 1 → `2.2.0` — Types and correctness · `minor + changelog` (behavior changes)

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

### Batch 2 → `2.3.0` — EventManager and unified event API · `minor + changelog`

- EventManager with a subscription registry (item 6), **event source abstracted behind an
  interface** (TurboModule-ready); decide the duplicate-`(event, callback)` policy up front
- Android bridge: add `addListener` / `removeListeners` stubs so `NativeEventEmitter` works on
  both platforms (closes the `DeviceEventEmitter` split)
- `addEventListener` / `removeEventListener` on top (item 3)
- No-op subscription + shared type + `__DEV__` warning (item 4)
- JS tests on the public EventManager contract

### Batch 3 → `2.4.0` — Namespaces and documentation · no breaking

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
3. Resolve the event model (codegen events or a legacy emitter alongside).
4. Native/integration tests + manual QA for queue overflow & init ordering (deferred from
   Batch 2).

---

**Excluded from scope** (requires native Reteno SDK changes): `logout`/clear identity,
consent/GDPR, push subscription opt-in/opt-out, client-side in-app triggers, a **Reteno-native**
unified permission API (symmetric opt-in/opt-out driven by the native SDK on both platforms).
This does *not* cover making the existing wrapper honest — see the scope split under finding 01,
which stays in scope and ships in Batch 1.

**Strengths left untouched:** App Inbox, structured Ecommerce events, Recommendations,
anonymous/multi-account attributes.

