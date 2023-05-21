## API

| Method                                             | Supported platform | Description                                                                                                                       |
| -------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| [setUserAttributes](../src/index.tsx)              | iOS, Android       | [Types](../src/index.ts)                                                                                                          |
| [logEvent](../src/index.tsx)                       | iOS, Android       | [Types](../src/index.ts)                                                                                                          |
| [getInitialNotification](../src/index.ts)          | iOS, Android       | Returns push notification that triggered creating app instance                                                                    |
| [setOnRetenoPushReceivedListener](../src/index.ts) | iOS, Android       | Sets listener for newly received push notification;                                                                               |
| [registerForRemoteNotifications](../src/index.ts)  | iOS                | Allows to make a custom call to ios registerForRemoteNotifications method, the native iOS notification permission prompt is shown |
