# Push notification

> Every method below is also available grouped under the `push` namespace (e.g. `push.setOnReceivedListener`) — see [Namespaced API](../NamespacedAPI/README.md).

## Initialize SDK and event handler

Set this up once, in the root component of your app. **The order matters:**

1. `await initialize(...)`
2. register every listener you need
3. call `initializeEventHandler()` — once
4. `await registerForRemoteNotifications()` — **iOS only**

Events that arrive before step 3 are held in a native queue, and `initializeEventHandler()` flushes it. Any listener registered *after* that call misses whatever was already queued — most importantly the push click that launched a terminated app on Android. Registering listeners first is what makes cold start work.

`registerForRemoteNotifications()` triggers the native iOS permission prompt and push registration. On Android it's a no-op — the SDK registers for push automatically once `initialize()` runs, via `RetenoFirebaseMessagingService` registered in the library's own manifest. It's safe to call unconditionally on both platforms, as the example below does, but don't rely on it to obtain an Android push token.

```ts
import React, { useEffect } from "react";
import {
  initialize,
  initializeEventHandler,
  registerForRemoteNotifications,
  setOnRetenoPushReceivedListener,
  setOnRetenoPushClickedListener,
} from "reteno-react-native-sdk";

useEffect(() => {
  let listeners: Array<{ remove: () => void }> = [];

  const bootstrap = async () => {
    // 1. Initialize
    await initialize({
      apiKey: "YOUR_SDK_ACCESS_KEY",
    });

    // 2. Register all listeners BEFORE flushing the queue
    listeners = [
      setOnRetenoPushReceivedListener((event) => {
        // ...
      }),
      setOnRetenoPushClickedListener((event) => {
        // ...
      }),
    ];

    // 3. Flush queued events and start live delivery — call once
    initializeEventHandler();

    // 4. Ask for the push token (iOS only — no-op on Android, see above)
    await registerForRemoteNotifications();
  };

  bootstrap();

  return () => listeners.forEach((l) => l?.remove());
}, []);
```

> **Note:** Place this in the root component of your app (e.g., `App.tsx`), not inside a screen or nested component. The examples further down show individual listeners in isolation for readability — in a real app they all belong in this one block, and `initializeEventHandler()` is called only once, after all of them.

If your app uses `@react-native-firebase/messaging`, add `iosDeviceTokenHandlingMode: "manual"` to the `initialize` options:

```ts
await initialize({
  apiKey: "YOUR_SDK_ACCESS_KEY",
  iosDeviceTokenHandlingMode: "manual",
});
```

In this mode the SDK bridges the FCM token to Reteno automatically — no manual `setDeviceToken` call needed.

## Listen for new push notifications while app is active

While app is open, you may need to track, if there is new push;
To do so, set listener using `setOnRetenoPushReceivedListener` function;

```ts
import React, { useCallback, useEffect } from "react";

import { Alert } from "react-native";
import { setOnRetenoPushReceivedListener } from "reteno-react-native-sdk";

const onRetenoPushReceived = useCallback((event) => {
  Alert.alert("onRetenoPushReceived", event ? JSON.stringify(event) : event);
}, []);

useEffect(() => {
  const pushListener = setOnRetenoPushReceivedListener(onRetenoPushReceived);
  return () => pushListener.remove();
}, [onRetenoPushReceived]);
```

## Listen for Push Notification Clicks

To handle push notification clicks, you can set up a listener using the `setOnRetenoPushClickedListener` function provided by the `reteno-react-native-sdk`.

```ts
import React, { useCallback, useEffect } from "react";

import { Alert } from "react-native";
import { setOnRetenoPushClickedListener } from "reteno-react-native-sdk";

const onRetenoPushClicked = useCallback((event) => {
  Alert.alert("onRetenoPushClicked", event ? JSON.stringify(event) : event);
}, []);

useEffect(() => {
  const pushClickListener = setOnRetenoPushClickedListener(onRetenoPushClicked);
  return () => pushClickListener.remove();
}, [onRetenoPushClicked]);
```

## Deep links and controlling link opening

By default the SDK opens any URL attached to a push notification or an in-app message directly in the browser. If your app has its own router — React Navigation or similar — you will usually want to handle those URLs yourself instead.

| Method | Description |
|---|---|
| `setAutoOpenLinks(enabled: boolean)` | Enable or disable automatic URL opening. Default: `true` |
| `getAutoOpenLinks()` | Read the current setting. Returns `Promise<boolean>` |

### What the flag actually covers

The scope of `setAutoOpenLinks(false)` differs by platform:

| | Push notification links | In-app message links |
|---|---|---|
| **iOS** | suppressed | suppressed |
| **Android** | **not suppressed** — the native SDK opens the URL anyway | suppressed |

On Android the flag is only consulted on the in-app data path. A tap on a push notification that carries a link is handled inside the native push module, which opens the URL with an `ACTION_VIEW` intent regardless of this setting.

> **Consequence on Android:** if you disable the flag and also navigate from `setOnRetenoPushClickedListener`, a single tap routes twice — the native SDK opens the link, and your handler navigates as well. For pushes that carry a link, either let the native SDK open it and do not navigate yourself, or send the destination as custom push data instead of a link and route from that.

### Example

```ts
import React, { useEffect } from "react";
import { Platform } from "react-native";
import {
  setAutoOpenLinks,
  setOnRetenoPushClickedListener,
  addInAppMessageCustomDataHandler,
  initializeEventHandler,
} from "reteno-react-native-sdk";

useEffect(() => {
  // Stop the SDK from opening URLs in the browser.
  // In-app links on both platforms; push links on iOS only.
  setAutoOpenLinks(false);

  const pushClickListener = setOnRetenoPushClickedListener((event) => {
    // On Android, do not navigate here for pushes that carry a link —
    // the native SDK has already opened it.
    if (Platform.OS === "ios") {
      // Route the push destination through your own navigator
    }
  });

  const inAppListener = addInAppMessageCustomDataHandler((data) => {
    if (data.url) {
      // e.g. navigation.navigate("WebView", { url: data.url });
    }
  });

  // initializeEventHandler() is called once in your root setup,
  // after every listener has been registered — see "Initialize SDK and event handler".

  return () => {
    pushClickListener?.remove();
    inAppListener?.remove();
  };
}, []);
```

The setting is stored natively, so it survives restarts. If you expose it as a toggle in your UI, read the current value on start with `getAutoOpenLinks()`.

### Data passed to the in-app handler

```ts
type InAppCustomData = {
  customData?: Record<string, any>; // custom data attached to the message
  url?: string; // the URL that was clicked
  inapp_id?: string; // in-app message ID (Android)
  inapp_source?: "DISPLAY_RULES" | "PUSH_NOTIFICATION"; // source (Android)
};
```

### Cold start (app launched by tapping a push)

The two platforms behave differently here, and handling both the same way causes a bug.

**Android — the click listener works.** The native click receiver puts the event into an internal queue when JavaScript is not running yet, and `initializeEventHandler()` flushes that queue. `setOnRetenoPushClickedListener` therefore receives the launching push as well, provided you register the listener *before* calling `initializeEventHandler()`. No extra native setup is needed.

**iOS — the click listener does not fire.** Listeners do not exist yet at the moment iOS delivers the tap. When the SDK later replays that push during initialization it re-runs its own processing — click attribution and push-triggered in-app messages — but it does not re-invoke the JavaScript callback. Read the launching push explicitly with `getInitialNotification()`, which resolves with the payload of the push that instantiated the app, or `null` if the app was started any other way.

> **Do not call `getInitialNotification()` unconditionally.** On Android it returns the same push that already reached your click listener, so handling both paths navigates twice for a single tap. Guard it by platform.

```ts
import { useEffect } from "react";
import { Platform } from "react-native";
import {
  getInitialNotification,
  setOnRetenoPushClickedListener,
  initializeEventHandler,
} from "reteno-react-native-sdk";

useEffect(() => {
  const openFromPush = (notification: any) => {
    // your routing
  };

  // Register listeners first — on Android this is what lets the queued
  // cold-start click be delivered when the queue is flushed below.
  const clickListener = setOnRetenoPushClickedListener(openFromPush);

  // iOS only: the launching push never reaches the listener.
  if (Platform.OS === "ios") {
    getInitialNotification().then((notification) => {
      if (notification) openFromPush(notification);
    });
  }

  // The single call from your root setup — it flushes the queue, so it must
  // come after the listener above, not before it.
  initializeEventHandler();

  return () => clickListener?.remove();
}, []);
```

On iOS this also requires `RetenoReactNativeSdk.delayedStart()` in your AppDelegate — see [iOS setup, Step 4.1](../SetupGuide/IOS.md#step-41-add-retenoreactnativesdkdelayedstart-to-your-appdelegate). It is what makes click attribution and push-triggered in-app messages work on a cold start; it does not deliver the event to your listener.

Test deep links in all three states — foreground, background, and fully terminated — on both platforms. Warm-start behaviour working is not evidence that cold start works, and Android working is not evidence that iOS does.

## Listen for push dismiss events (Android only)

```ts
import React, { useEffect } from "react";

import { Alert } from "react-native";
import { setOnRetenoPushDismissedListener } from "reteno-react-native-sdk";

useEffect(() => {
  const dismissedListener = setOnRetenoPushDismissedListener((event) => {
    Alert.alert("onRetenoPushDismissed", event ? JSON.stringify(event) : event);
  });

  return () => {
    if (dismissedListener) dismissedListener.remove();
  };
}, []);
```

## Listen for custom push data (Android only)

```ts
import React, { useEffect } from "react";

import { Alert } from "react-native";
import { setOnRetenoCustomPushDataListener } from "reteno-react-native-sdk";

useEffect(() => {
  const customPushListener = setOnRetenoCustomPushDataListener((event) => {
    Alert.alert("onRetenoCustomPushData", event ? JSON.stringify(event) : event);
  });

  return () => {
    if (customPushListener) customPushListener.remove();
  };
}, []);
```

## Notification permission helpers (Android only)

Use SDK helper methods to request permission and read the current status.

```ts
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from "reteno-react-native-sdk";

requestNotificationPermission().then((granted) => {
  console.log("Notification permission granted:", granted);
});

getNotificationPermissionStatus().then((status) => {
  // ALLOWED | DENIED | PERMANENTLY_DENIED
  console.log("Notification permission status:", status);
});
```

## Pause push-triggered in-app messages (Android only)

```ts
import {
  pausePushInAppMessages,
  setPushInAppMessagesPauseBehaviour,
} from "reteno-react-native-sdk";

pausePushInAppMessages(true); // pause
pausePushInAppMessages(false); // unpause

setPushInAppMessagesPauseBehaviour("SKIP_IN_APPS");
setPushInAppMessagesPauseBehaviour("POSTPONE_IN_APPS");
```

## Group notifications (Android only)

Notifications can be grouped by a value in the push payload or by a constant group ID. The rule is persisted natively and restored before React Native starts, so it also applies to notifications received while the app is not running.

```ts
import { setNotificationGroupingRule } from "reteno-react-native-sdk";

// Group by a payload value, e.g. all pushes for the same chat
await setNotificationGroupingRule({ payloadKey: "chatId" });

// Group under a constant ID, regardless of payload
await setNotificationGroupingRule({ groupId: "messages" });

// Also show the collapsed "N new notifications" summary row Android displays
// when it stacks the group
await setNotificationGroupingRule({ groupId: "messages", showSummary: true });

// Disable grouping
await setNotificationGroupingRule(null);
```

The rule must contain exactly one non-empty `payloadKey` or `groupId`.

### Summary notification (`showSummary`)

Pass `showSummary: true` to also get the collapsed "N new notifications" row Android shows when it stacks a group. The SDK creates and maintains this summary notification for you natively — no native code or manual `NotificationCompat` setup needed. It:

- creates a dedicated `reteno_group_summary` notification channel (Android 8.0+),
- posts/updates the summary once at least two notifications share a group, using the fixed text "New notifications" / "You have N new notifications" (not currently customizable),
- removes the summary once fewer than two grouped notifications remain, e.g. after the user dismisses one down to a single leftover,
- automatically clears any existing summary if you call `setNotificationGroupingRule` again with a different `payloadKey`/`groupId`.

Requires Android 6.0 (API 23) or higher — on older devices the call still resolves successfully and grouping still applies, but no summary is shown. Like any notification, posting the summary also requires the `POST_NOTIFICATIONS` runtime permission on Android 13+ (see [Manual permission flow fallback on Android](#manual-permission-flow-fallback-on-android) below); if it isn't granted, the summary is silently skipped until permission is granted and the next push arrives.

## Manual permission flow fallback on Android

When dealing with notifications on Android 13 and later versions, it's important to handle permissions properly at runtime. After obtaining permission from the user, you need to notify the Reteno SDK by calling the `updatePushPermissionStatusAndroid()` function from the Reteno interface.

```ts
import React, { useEffect } from "react";

import { updatePushPermissionStatusAndroid } from "reteno-react-native-sdk";

useEffect(() => {
  PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS!
  ).then((result) => {
    if (result === "granted") {
      updatePushPermissionStatusAndroid().then((status) => {
        console.log("Update status:", status);
      });
    }
  });
}, []);
```
