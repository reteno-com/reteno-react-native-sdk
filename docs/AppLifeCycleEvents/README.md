# App Lifecycle Events

Reteno SDK can automatically track application lifecycle and track events that described below.

## Track AppLifecycle Events

When app lifecycle tracking is enabled in `lifecycleTrackingOptions` (`appLifecycleEnabled`), `Reteno` tracks the following events:

| Event Name                | Properties                                     | Description                                                                                    |
| ------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ApplicationInstalled`    | version, build                                 | This event fires when a user opens the application for the first time right after installation |
| `ApplicationUpdated`      | version, build, previousVersion, previousBuild | This event fires when a user opens the application after updating the application              |
| `ApplicationOpened`       | fromBackground                                 | This event fires when a user launches or foregrounds the application after the first open      |
| `ApplicationBackgrounded` | applicationOpenedTime, secondsInForeground     | This event fires when a user backgrounds the application                                       |

## Track Push Subscription Events

When push subscription tracking is enabled in `lifecycleTrackingOptions` (`pushSubscriptionEnabled`), `Reteno` tracks the following events:

| Event Name                      | Description                                                          |
| ------------------------------- | -------------------------------------------------------------------- |
| `PushNotificationsSubscribed`   | This event fires when a customer susbribes for push notifications    |
| `PushNotificationsUnsubscribed` | This event fires when a customer unsusbribes from push notifications |

## Track Session Events

When session tracking is enabled in `lifecycleTrackingOptions` (`sessionStartEventsEnabled` / `sessionEndEventsEnabled`), `Reteno` tracks the following events:

| Event Name       | Properties                                                                                  | Description                                    |
| ---------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `SessionStarted` | sessionId, startTime                                                                        | This event fires when a user's session started |
| `SessionEnded`   | sessionID, endTime, durationInSeconds, applicationOpenedCount, applicationBackgroundedCount | This event fires when a user's session ended   |

## Configure lifecycle tracking in React Native

Use `initialize(...)` and pass `lifecycleTrackingOptions`.

```ts
import { initialize } from "reteno-react-native-sdk";

await initialize({
  apiKey: "YOUR_SDK_ACCESS_KEY",
  lifecycleTrackingOptions: {
    appLifecycleEnabled: true,
    foregroundLifecycleEnabled: false,
    pushSubscriptionEnabled: true,
    sessionStartEventsEnabled: true,
    sessionEndEventsEnabled: false,
  },
});
```

You can also pass shortcut values:

- `"ALL"` to enable all lifecycle categories
- `"NONE"` to disable all lifecycle categories
