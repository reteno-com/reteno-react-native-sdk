# App inbox

> Every method below is also available grouped under the `inbox` namespace (e.g. `inbox.getMessages`) — see [Namespaced API](../NamespacedAPI/README.md).

## Get App Inbox Messages

You can retrieve inbox messages from your React Native application using the `getAppInboxMessages` method. Inbox messages can be useful for displaying notifications, promotions, or other types of messages to your users.

This function retrieves inbox messages from the server and handles the success or error cases accordingly.

```ts
import { getAppInboxMessages } from "reteno-react-native-sdk";

/**
 * Interface representing parameters for fetching inbox messages.
 *
 * export type AppInboxStatus = 'OPENED' | 'UNOPENED';
 *
 * export type GetAppInboxMessages = {
 *  page?: number;          // The page number to retrieve (optional).
 *  pageSize?: number;      // The number of messages per page (optional).
 *  status?: AppInboxStatus; // The status of messages (optional)
 * };
 */

/**
 * Interface representing an inbox message.
 * export type InboxMessage = {
 * id: string; // The unique identifier of the message.
 * title: string; // The title of the message.
 * createdDate: string | number; // Format differs by platform: Android sends the raw date string from the API as-is; iOS sends a Unix timestamp in seconds (number).
 * imageURL?: string; // The URL of an image associated with the message (optional)
 * linkURL?: string; // The URL to redirect the user when the message is clicked (optional).
 * isNew: boolean; // A flag indicating whether the message is new.
 * content?: string; // The content of the message (optional).
 * category?: string; // The category of the message.
 * status?: AppInboxStatus; // The status of the message (only available on Android — the iOS native SDK has no equivalent concept).
};
 */

const handleDownloadMessages = () => {
  getAppInboxMessages({})
    .then((response) => {
      Alert.alert(
        "Success download messages",
        response ? JSON.stringify(response) : response
      );
    })
    .catch((error) => {
      Alert.alert("Error", error);
    });
};
```

## Get Inbox Unread Messages Count

You can subscribe to changes in the unread messages count in your React Native application using the `onUnreadMessagesCountChanged` method. This allows you to receive notifications whenever the unread messages count changes.

You can use these functions to unsubscribe from changes in the unread messages count in your application: `unsubscribeMessagesCountChanged` and `unsubscribeAllMessagesCountChanged`.

```ts
import {
  onUnreadMessagesCountChanged,
  unsubscribeMessagesCountChanged,
  unsubscribeAllMessagesCountChanged,
} from "reteno-react-native-sdk";

useEffect(() => {
  // Subscribe to unread messages count changes
  onUnreadMessagesCountChanged().catch((error) =>
    console.warn("Failed to subscribe:", error)
  );

  return () => {
    // Unsubscribe from changes in the unread messages count
    unsubscribeMessagesCountChanged().catch((error) =>
      console.warn("Failed to unsubscribe callback:", error)
    );
    unsubscribeAllMessagesCountChanged().catch((error) =>
      console.warn("Failed to unsubscribe all callbacks:", error)
    );
  };
}, []);
```

## Handling Unread Messages Count Events

You can handle events related to changes in the unread messages count in your React Native application using the following methods:

```ts
import {
  unreadMessagesCountHandler,
  unreadMessagesCountErrorHandler,
} from "reteno-react-native-sdk";

useEffect(() => {
  // Subscribe to events related to changes in the unread messages count
  const unreadMessagesCountListener = unreadMessagesCountHandler((data) => {
    Alert.alert(
      "Unread Messages Count Changed",
      data ? JSON.stringify(data) : data
    );
  });

  return () => {
    // Remove the subscription when the component unmounts
    unreadMessagesCountListener.remove();
  };
}, []);

useEffect(() => {
  // Subscribe to events related to errors in the unread messages count (Android Only)
  const unreadMessagesCountErrorListener = unreadMessagesCountErrorHandler(
    (error) =>
      Alert.alert(
        "Unread Messages Count Error",
        error ? JSON.stringify(error) : error
      )
  );

  return () => {
    // Remove the subscription when the component unmounts
    if (unreadMessagesCountErrorListener) {
      unreadMessagesCountErrorListener.remove();
    }
  };
}, []);
```

## Marking Messages as Opened

You can mark messages as opened in your React Native application using the `markAsOpened` function. This function takes an array of message IDs — both platforms mark every ID supplied — and returns a promise that resolves to an object containing the status of the operation.

```ts
import { markAsOpened } from "reteno-react-native-sdk";

const handleMarkAsOpened = () => {
  markAsOpened([messageId])
    .then((response) => {
      Alert.alert(
        "Success Marked as Opened",
        response ? JSON.stringify(response) : response
      );
    })
    .catch((error) => {
      Alert.alert("Error", error);
    });
};
```

## Marking All Messages as Opened

You can mark all messages as opened in your React Native application using the `markAllAsOpened` function. This function does not require any parameters and returns a promise that resolves to an object containing the status of the operation.

```ts
import { markAllAsOpened } from "reteno-react-native-sdk";

const handleMarkAllAsOpened = () => {
  markAllAsOpened()
    .then((response) => {
      Alert.alert(
        "Success Marked All as Opened",
        response ? JSON.stringify(response) : response
      );
    })
    .catch((error) => {
      Alert.alert("Error", error);
    });
};
```

## Getting Inbox Messages Count

You can retrieve the count of inbox messages in your React Native application using the `getAppInboxMessagesCount` function. It returns a promise that resolves to the number of inbox messages.

```ts
import { getAppInboxMessagesCount } from "reteno-react-native-sdk";

const handleGetAppInboxMessagesCount = () => {
  getAppInboxMessagesCount()
    .then((response) => {
      Alert.alert(
        "Success",
        response !== null ? JSON.stringify(response) : response
      );
    })
    .catch((error) => {
      Alert.alert("Error", error);
    });
};
```
