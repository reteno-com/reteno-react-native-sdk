# In app messages

> Every method below is also available grouped under the `inApp` namespace (e.g. `inApp.pauseMessages`) — see [Namespaced API](../NamespacedAPI/README.md).

Bundled native SDKs support the `DOES_NOT_EQUAL` in-app rule condition: Android SDK 2.9.6+ and iOS SDK 2.7.2+.

## Pause In-App Messages

You can manage the display of In-App messages in your React Native application by pausing them when needed. Pausing In-App messages can be useful to prevent interruptions during critical user flows such as registration or payment processes.

You can pause or unpause In-App messages at any time during the application's lifecycle.

```ts
import { pauseInAppMessages } from "reteno-react-native-sdk";

/*
  isPaused: (boolean) Flag indicating whether to pause (true) or unpause (false) In-App messages.
*/

const handleInAppMessagesStatus = (isPaused: boolean) => {
  pauseInAppMessages(isPaused)
    .then(() => {
      Alert.alert("Success", "Pause state changed");
    })
    .catch((error) => {
      Alert.alert("Error", error);
    });
};
```

## Configure In-App Pause Behaviour

You can configure what should happen with in-app messages received while pause is enabled using `setInAppMessagesPauseBehaviour`.

- `SKIP_IN_APPS`: Skip all in-app messages that arrived during pause.
- `POSTPONE_IN_APPS`: Show the first postponed in-app message when pause is disabled.

```ts
import {
  setInAppMessagesPauseBehaviour,
  InAppPauseBehaviour,
} from "reteno-react-native-sdk";

const setPauseBehaviour = (behaviour: InAppPauseBehaviour) => {
  setInAppMessagesPauseBehaviour(behaviour)
    .then(() => Alert.alert("Success", `Behaviour set to ${behaviour}`))
    .catch((error) => Alert.alert("Error", String(error)));
};

setPauseBehaviour("SKIP_IN_APPS");
setPauseBehaviour("POSTPONE_IN_APPS");
```

## In-App Message Lifecycle Events

Additionally, you can subscribe to various in-app lifecycle events to receive notifications when specific actions occur, such as before an in-app message is displayed, when it is displayed, before it is closed, after it is closed, or if an error occurs during its display.

Event Handlers:

- **beforeInAppDisplayHandler**
- **onInAppDisplayHandler**
- **beforeInAppCloseHandler**
- **afterInAppCloseHandler**
- **onInAppErrorHandler**

To subscribe on lifecycle events you can use `setInAppLifecycleCallback`. And only on Android - to unsubscribe you can use `removeInAppLifecycleCallback`.

```ts
import { useEffect } from "react";
import { Alert } from "react-native";
import {
  setInAppLifecycleCallback,
  beforeInAppDisplayHandler,
  onInAppDisplayHandler,
  beforeInAppCloseHandler,
  afterInAppCloseHandler,
  onInAppErrorHandler,
  removeInAppLifecycleCallback,
} from "reteno-react-native-sdk";

useEffect(() => {
  // Set the in-app lifecycle callback
  setInAppLifecycleCallback();

  const beforeInAppDisplayListener = beforeInAppDisplayHandler((data) =>
    Alert.alert(
      "Before In-App Display",
      data ? JSON.stringify(data) : "No data received"
    )
  );
  const onInAppDisplayListener = onInAppDisplayHandler((data) =>
    Alert.alert(
      "On In-App Display",
      data ? JSON.stringify(data) : "No data received"
    )
  );
  const beforeInAppCloseListener = beforeInAppCloseHandler((data) =>
    Alert.alert(
      "Before In-App Close",
      data ? JSON.stringify(data) : "No data received"
    )
  );
  const afterInAppCloseListener = afterInAppCloseHandler((data) =>
    Alert.alert(
      "After In-App Close",
      data ? JSON.stringify(data) : "No data received"
    )
  );
  const onInAppErrorListener = onInAppErrorHandler((data) =>
    Alert.alert(
      "On In-App Error",
      data ? JSON.stringify(data) : "No data received"
    )
  );

  // Remove listeners when component unmounts
  return () => {
    beforeInAppDisplayListener.remove();
    onInAppDisplayListener.remove();
    beforeInAppCloseListener.remove();
    afterInAppCloseListener.remove();
    onInAppErrorListener.remove();

    // Remove the in-app lifecycle callback if it exists (only for Android)
    removeInAppLifecycleCallback();
  };
}, []);
```

## Handling In-App Messages Custom Data

This method allows receiving custom data sent with in-app messages in a React Native app using the Reteno SDK.

**Note:** If you want to receive custom data from in app messages you should be subscribed on in-app lifecycle events (see methods above).

```ts
import { useEffect } from "react";
import { Alert } from "react-native";
import { addInAppMessageCustomDataHandler } from "reteno-react-native-sdk";

useEffect(() => {
  const addInAppMessageCustomDataListener = addInAppMessageCustomDataHandler(
    (data) =>
      Alert.alert(
        "Custom Data Received",
        data ? JSON.stringify(data) : "No custom data received"
      )
  );

  return () => {
    addInAppMessageCustomDataListener.remove();
  };
}, []);
```
