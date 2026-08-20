# Tracking user behaviour

## Track Custom Events

Reteno SDK provides ability to track custom events.

```ts
import { logEvent } from "reteno-react-native-sdk";

const eventName = "EVENT_NAME";
const date = new Date().toISOString();
const parameters = [
  {
    name: "Additional parameter",
    value: "Additional value",
  },
];
const forcePush = false;

logEvent(eventName, date, parameters, forcePush);
```

The `parameters` list item structure:

```typescript
type CustomEventParameter = {
  name: string;
  value?: string;
};
```

**Note**

`date`

Date should be in [ISO8601](https://en.wikipedia.org/wiki/ISO_8601) format

`forcePush` is `iOS`-only feature; Please read more about it [here](https://github.com/reteno-com/reteno-mobile-ios-sdk/blob/b8a9c60da9a41dc7cb22260b6ef8e5a842752b5e/Reteno/Sources/Core/Reteno.swift#L47)

## Force push data

Reteno SDK caches all events (events, device data, user information, user behavior, screen tracking, push statuses, etc) locally into database. Call `forcePushData` function to send all accumulated events, you can read more about how Reteno caches and sends events [here](https://docs.reteno.com/reference/tracking-user-behaviour#force-push-locally-cached-data):

```typescript
function forcePushData(): Promise<void>;
```

## Log screen view events

You can send screen view events using `logScreenView` function:

```typescript
function logScreenView(screenName: string): Promise<void>;
```

There are a few ways to implement the navigation within React Native apps, therefore there is no "one fits all" , this function provides a basic mechanism for sending screen view events, and you can use it whatever way you want.

```typescript
const someRouteName = getSomeRouteName();
await logScreenView(someRouteName);
```

You can check an example provided by [React Navigation](https://reactnavigation.org/) library, which can give you an idea of the implementation. See [Screen tracking for analytics](https://reactnavigation.org/docs/screen-tracking/) documentation.

## Mobile Push Subscribers

### iOS usage

`Reteno SDK` uses the `pushSubscribed` parameter for tracking the status of the user’s subscription to push notifications. This covers the following cases:

- When a customer does not subscribe to receive push notifications (`pushSubscribed` is false), no token is created for that customer.
- When a customer subscribes to receive push notifications (`pushSubscribed` is true), a token is created for a new customer.
- When a customer unsubscribes from receiving push notifications (`pushSubscribed` is false), the existing customer token is deleted.

`Reteno` can track push notification subscription events. This event will be tracked automatically but it can be managed via `lifecycleTrackingOptions` in `initialize(...)`.

```ts
import { initialize } from "reteno-react-native-sdk";

await initialize({
  apiKey: "YOUR_SDK_ACCESS_KEY",
  lifecycleTrackingOptions: {
    pushSubscriptionEnabled: true,
  },
});
```

When push subscription tracking is enabled in `lifecycleTrackingOptions`, `Reteno` tracks the following events:

| Event Name                      | Description                                                           |
| ------------------------------- | --------------------------------------------------------------------- |
| `PushNotificationsSubscribed`   | This event fires when a customer subscribes for push notifications    |
| `PushNotificationsUnsubscribed` | This event fires when a customer unsubscribes from push notifications |

### Android usage

Your end-user may prohibit receiving pushes by disabling `Reteno` notification channel or disabling notifications for your application in Android OS settings menu. In this case SDK will notify its servers to prevent sending push notifications to this specific device.

SDK checks notifications enabled status in these cases:

- On App resume
- On push received event
- On settings changed in Android OS Settings menu (starting from Android 9.0, using system broadcast)

Once status `false` sent to the server, the backend won't send any push notifications to this device until the end-user re-enables channel/notifications. Once the end-user re-enables channel/notifications the server will be notified and will send push notifications again.

## Track Session Events

`Reteno` can track start and end session events. This is tracked automatically, and can be configured via `initialize(...)`. The configuration applies to both iOS and Android.

```ts
import { initialize } from "reteno-react-native-sdk";

await initialize({
  apiKey: "YOUR_SDK_ACCESS_KEY",
  lifecycleTrackingOptions: {
    sessionStartEventsEnabled: true,
    sessionEndEventsEnabled: true,
  },
});
```

When session tracking is enabled in `lifecycleTrackingOptions`, `Reteno` tracks the following events:

| Event Name       | Properties                                                                                  | Description                                    |
| ---------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `SessionStarted` | sessionId, startTime                                                                        | This event fires when a user's session started |
| `SessionEnded`   | sessionID, endTime, durationInSeconds, applicationOpenedCount, applicationBackgroundedCount | This event fires when a user's session ended   |
