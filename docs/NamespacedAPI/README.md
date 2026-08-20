# Namespaced API

Available since `reteno-react-native-sdk` `v3.0.0`.

Every SDK method has always been exported as a flat, top-level function — `setUserAttributes`, `setOnRetenoPushReceivedListener`, `logEcomEventOrderCreated`, and so on. That flat form is unchanged and **stays the canonical, fully supported API** — nothing in this page deprecates it.

Starting with `v3.0.0`, the same functions are additionally grouped into seven namespaced objects: `user`, `push`, `events`, `inApp`, `inbox`, `recommendations`, `ecommerce`. Each namespace member is the identical function reference as its flat counterpart (`push.setDeviceToken === setDeviceToken`), just re-exposed under a shorter, grouped name — pick whichever style reads better in your codebase, or mix them.

## Usage

Import the namespace(s) you need directly:

```ts
import { push, user, inApp } from "reteno-react-native-sdk";

await user.setAttributes({ externalUserId: "USER_ID", user: { /* ... */ } });

const clickListener = push.setOnClickedListener((event) => {
  // ...
});

inApp.setAutoOpenLinks(false);
```

Or import everything under one alias if you prefer a single `Reteno.` prefix everywhere:

```ts
import * as Reteno from "reteno-react-native-sdk";

await Reteno.initialize({ apiKey: "YOUR_SDK_ACCESS_KEY" });
await Reteno.user.setAttributes({ externalUserId: "USER_ID", user: {} });
Reteno.events.addEventListener("pushReceived", (event) => {
  // ...
});
```

Note that a handful of top-level functions — `initialize`, `logEvent`, `logScreenView`, `forcePushData` — are not part of any namespace and stay flat-only; they don't belong to one specific feature area.

## Namespace reference

### `user`

| Namespaced | Flat equivalent |
|---|---|
| `user.setAttributes` | `setUserAttributes` |
| `user.setMultiAccountAttributes` | `setMultiAccountUserAttributes` |
| `user.setAnonymousAttributes` | `setAnonymousUserAttributes` |

See [Tracking user information](../Tracking%20user%20information/README.md).

### `push`

| Namespaced | Flat equivalent |
|---|---|
| `push.setDeviceToken` | `setDeviceToken` |
| `push.registerForRemoteNotifications` | `registerForRemoteNotifications` |
| `push.getInitialNotification` | `getInitialNotification` |
| `push.setOnReceivedListener` | `setOnRetenoPushReceivedListener` |
| `push.setOnClickedListener` | `setOnRetenoPushClickedListener` |
| `push.setOnButtonClickedListener` | `setOnRetenoPushButtonClickedListener` (iOS only) |
| `push.setOnDismissedListener` | `setOnRetenoPushDismissedListener` (Android only) |
| `push.setOnCustomDataListener` | `setOnRetenoCustomPushDataListener` (Android only) |
| `push.requestNotificationPermission` | `requestNotificationPermission` (Android only) |
| `push.getNotificationPermissionStatus` | `getNotificationPermissionStatus` (Android only) |
| `push.updatePermissionStatusAndroid` | `updatePushPermissionStatusAndroid` (Android only) |
| `push.pauseTriggeredInAppMessages` | `pausePushInAppMessages` (Android only) |
| `push.setTriggeredInAppMessagesPauseBehaviour` | `setPushInAppMessagesPauseBehaviour` (Android only) |
| `push.setGroupingRule` | `setNotificationGroupingRule` (Android only) |

See [Push notification](../Push%20notification/README.md).

### `events`

| Namespaced | Flat equivalent |
|---|---|
| `events.addEventListener` | `addEventListener` |
| `events.removeEventListener` | `removeEventListener` |
| `events.initializeEventHandler` | `initializeEventHandler` |

### `inApp`

| Namespaced | Flat equivalent |
|---|---|
| `inApp.setLifecycleCallback` | `setInAppLifecycleCallback` |
| `inApp.removeLifecycleCallback` | `removeInAppLifecycleCallback` (Android only) |
| `inApp.beforeDisplay` | `beforeInAppDisplayHandler` |
| `inApp.onDisplay` | `onInAppDisplayHandler` |
| `inApp.beforeClose` | `beforeInAppCloseHandler` |
| `inApp.afterClose` | `afterInAppCloseHandler` |
| `inApp.onError` | `onInAppErrorHandler` |
| `inApp.onCustomData` | `addInAppMessageCustomDataHandler` |
| `inApp.pauseMessages` | `pauseInAppMessages` |
| `inApp.setPauseBehaviour` | `setInAppMessagesPauseBehaviour` |
| `inApp.setAutoOpenLinks` | `setAutoOpenLinks` |
| `inApp.getAutoOpenLinks` | `getAutoOpenLinks` |

See [In-App Messages](../InAppMessages/README.md).

> **Note:** `push.pauseTriggeredInAppMessages` / `push.setTriggeredInAppMessagesPauseBehaviour` (Android-only, push-*triggered* in-apps) and `inApp.pauseMessages` / `inApp.setPauseBehaviour` (all in-apps, both platforms) wrap two different underlying methods — they are not aliases of each other.

### `inbox`

| Namespaced | Flat equivalent |
|---|---|
| `inbox.getMessages` | `getAppInboxMessages` |
| `inbox.markAsOpened` | `markAsOpened` |
| `inbox.markAllAsOpened` | `markAllAsOpened` |
| `inbox.getMessagesCount` | `getAppInboxMessagesCount` |
| `inbox.subscribeUnreadCount` | `onUnreadMessagesCountChanged` |
| `inbox.unsubscribeUnreadCount` | `unsubscribeMessagesCountChanged` |
| `inbox.unsubscribeAllUnreadCount` | `unsubscribeAllMessagesCountChanged` |
| `inbox.onUnreadCountChanged` | `unreadMessagesCountHandler` |
| `inbox.onUnreadCountError` | `unreadMessagesCountErrorHandler` (Android only) |

See [App Inbox](../AppInbox/README.md).

### `recommendations`

| Namespaced | Flat equivalent |
|---|---|
| `recommendations.get` | `getRecommendations` |
| `recommendations.logEvent` | `logRecommendationEvent` |

See [Recommendations](../Recommendations/README.md).

### `ecommerce`

| Namespaced | Flat equivalent |
|---|---|
| `ecommerce.productViewed` | `logEcomEventProductViewed` |
| `ecommerce.productCategoryViewed` | `logEcomEventProductCategoryViewed` |
| `ecommerce.productAddedToWishlist` | `logEcomEventProductAddedToWishlist` |
| `ecommerce.cartUpdated` | `logEcomEventCartUpdated` |
| `ecommerce.orderCreated` | `logEcomEventOrderCreated` |
| `ecommerce.orderUpdated` | `logEcomEventOrderUpdated` |
| `ecommerce.orderDelivered` | `logEcomEventOrderDelivered` |
| `ecommerce.orderCancelled` | `logEcomEventOrderCancelled` |
| `ecommerce.searchRequest` | `logEcomEventSearchRequest` |

See [Ecommerce](../Ecommerce/README.md).

## Migrating existing code

There is nothing to migrate — this is purely additive, and flat imports keep working exactly as before. If you do want to move a file over to the namespaced style, it's a mechanical rename with no behavior change, since each namespace member is a direct reference to its flat function:

```diff
- import { setUserAttributes, setOnRetenoPushReceivedListener } from "reteno-react-native-sdk";
+ import { user, push } from "reteno-react-native-sdk";

- setUserAttributes({ externalUserId, user: payload });
+ user.setAttributes({ externalUserId, user: payload });

- setOnRetenoPushReceivedListener(onReceived);
+ push.setOnReceivedListener(onReceived);
```

Types are unaffected either way — `SetUserAttributesPayload`, `RetenoSubscription`, and the rest of the exported types are shared by both call styles.
