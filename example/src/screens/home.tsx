import React, { useCallback, useMemo, useEffect } from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenNames, RootStackParamList } from '../config';
import {
  forcePushData,
  setOnRetenoPushReceivedListener,
  getInitialNotification,
  pauseInAppMessages,
  setInAppLifecycleCallback,
  beforeInAppDisplayHandler,
  onInAppDisplayHandler,
  beforeInAppCloseHandler,
  afterInAppCloseHandler,
  onInAppErrorHandler,
  removeInAppLifecycleCallback,
  addInAppMessageCustomDataHandler,
  getRecommendations,
  logRecommendationEvent,
  setOnRetenoPushClickedListener,
  downloadMessages,
  getUnreadMessagesCount,
  markAsOpened,
  markAllAsOpened,
} from 'reteno-react-native-sdk';

type Props = NativeStackScreenProps<RootStackParamList, ScreenNames.home>;

export default function Main({ navigation }: Props) {
  const form = useMemo(
    () => [
      {
        label: 'Attributes',
        route: ScreenNames.attributes,
      },
      {
        label: 'Anonymous Attributes',
        route: ScreenNames.anonymousUserAttributes,
      },
      {
        label: 'Events',
        route: ScreenNames.events,
      },
    ],
    []
  );

  const handleInAppMessagesStatus = (isPaused: boolean) => {
    pauseInAppMessages(isPaused)
      .then(() => {
        Alert.alert('Success', 'Pause state changed');
      })
      .catch((error) => {
        Alert.alert('Error', error);
      });
  };

  const handleDownloadMessages = () => {
    downloadMessages({})
      .then((response) => {
        Alert.alert(
          'Success download messages',
          response ? JSON.stringify(response) : response
        );
      })
      .catch((error) => {
        Alert.alert('Error', error);
      });
  };

  const handleGetUnreadMessagesCount = () => {
    console.log('HERE');
    getUnreadMessagesCount()
      .then((response) => {
        console.log('response', response);
        Alert.alert(
          'Success get unread messages count',
          JSON.stringify(response)
        );
      })
      .catch((error) => {
        Alert.alert('Error', error);
      });
  };

  const handleMarkAsOpened = () => {
    markAsOpened([])
      .then(() => {
        Alert.alert('Success mark as opened');
      })
      .catch((error) => {
        Alert.alert('Error', error);
      });
  };

  const handleMarkAllAsOpened = () => {
    markAllAsOpened()
      .then(() => {
        Alert.alert('Success mark all as opened');
      })
      .catch((error) => {
        Alert.alert('Error', error);
      });
  };

  const goTo = useCallback(
    (routeName: ScreenNames) => {
      navigation.navigate(routeName);
    },
    [navigation]
  );

  const onRetenoPushReceived = useCallback((event) => {
    Alert.alert('onRetenoPushReceived', event ? JSON.stringify(event) : event);
  }, []);

  const onRetenoPushClicked = useCallback((event) => {
    Alert.alert('onRetenoPushClicked', event ? JSON.stringify(event) : event);
  }, []);

  const handleGetRecommendations = () => {
    const recommendationsPayload = {
      recomVariantId: 'r1107v1482',
      productIds: ['240-LV09', '24-WG080'],
      categoryId: '',
      filters: [],
      fields: ['productId', 'name', 'descr', 'imageUrl', 'price'],
    };

    getRecommendations(recommendationsPayload)
      .then((response) => {
        Alert.alert(
          'Recommendations received:',
          response ? JSON.stringify(response) : response
        );
      })
      .catch((error) => {
        Alert.alert(
          'Error fetching recommendations:',
          error ? JSON.stringify(error) : error
        );
      });
  };

  const handleLogRecommendationEvent = () => {
    const recommendationEventPayload = {
      recomVariantId: 'r1107v1482',
      impressions: [
        {
          productId: '240-LV09',
        },
      ],
      clicks: [
        {
          productId: '24-WG080',
        },
      ],
      forcePush: true,
    };

    logRecommendationEvent(recommendationEventPayload)
      .then(() => {
        Alert.alert('Recommendation event logged successfully');
      })
      .catch((error) => {
        Alert.alert(
          'Error logging recommendation event:',
          error ? JSON.stringify(error) : error
        );
      });
  };

  useEffect(() => {
    getInitialNotification().then((data) => {
      Alert.alert('getInitialNotification', data ? JSON.stringify(data) : data);
    });
    const pushListener = setOnRetenoPushReceivedListener(onRetenoPushReceived);
    const pushClickListener =
      setOnRetenoPushClickedListener(onRetenoPushClicked);

    return () => {
      pushListener.remove();
      pushClickListener.remove();
    };
  }, [onRetenoPushReceived, onRetenoPushClicked]);

  useEffect(() => {
    setInAppLifecycleCallback();

    const beforeInAppDisplayListener = beforeInAppDisplayHandler((data) =>
      Alert.alert(
        'beforeInAppDisplayHandler',
        data ? JSON.stringify(data) : data
      )
    );
    const onInAppDisplayListener = onInAppDisplayHandler((data) =>
      Alert.alert('onInAppDisplayHandler', data ? JSON.stringify(data) : data)
    );
    const beforeInAppCloseListener = beforeInAppCloseHandler((data) =>
      Alert.alert('beforeInAppCloseHandler', data ? JSON.stringify(data) : data)
    );
    const afterInAppCloseListener = afterInAppCloseHandler((data) =>
      Alert.alert('afterInAppCloseHandler', data ? JSON.stringify(data) : data)
    );
    const onInAppErrorListener = onInAppErrorHandler((data) =>
      Alert.alert(
        'beforeInAppDisplayHandler',
        data ? JSON.stringify(data) : data
      )
    );

    const addInAppMessageCustomDataListener = addInAppMessageCustomDataHandler(
      (data) =>
        Alert.alert(
          'addInAppMessageCustomDataHandler',
          data ? JSON.stringify(data) : data
        )
    );

    return () => {
      beforeInAppDisplayListener.remove();
      onInAppDisplayListener.remove();
      beforeInAppCloseListener.remove();
      afterInAppCloseListener.remove();
      onInAppErrorListener.remove();

      removeInAppLifecycleCallback();

      addInAppMessageCustomDataListener.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {form.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.submitBtn}
            onPress={() => goTo(item.route)}
          >
            <Text style={styles.submitBtnText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.submitBtn} onPress={forcePushData}>
          <Text style={styles.submitBtnText}>Force push data</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => handleInAppMessagesStatus(true)}
        >
          <Text style={styles.submitBtnText}>Pause in app messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => handleInAppMessagesStatus(false)}
        >
          <Text style={styles.submitBtnText}>Unpause in app messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={setInAppLifecycleCallback}
        >
          <Text style={styles.submitBtnText}>
            Subscribe to in app messages events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={removeInAppLifecycleCallback}
        >
          <Text style={styles.submitBtnText}>
            Unsubscribe from in app messages events (Android)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleGetRecommendations}
        >
          <Text style={styles.submitBtnText}>Get Recommendations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleLogRecommendationEvent}
        >
          <Text style={styles.submitBtnText}>Log Recommendations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleDownloadMessages}
        >
          <Text style={styles.submitBtnText}>Download messages (Inbox)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleGetUnreadMessagesCount}
        >
          <Text style={styles.submitBtnText}>
            Get unread messages count (Inbox)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleMarkAsOpened}>
          <Text style={styles.submitBtnText}>Mark as opened (Inbox)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleMarkAllAsOpened}
        >
          <Text style={styles.submitBtnText}>Mark all as opened (Inbox)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'center',
  },
  submitBtn: {
    borderBottomColor: '#EBEBEB',
    borderBottomWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    paddingVertical: 20,
  },
  submitBtnText: {
    color: '#000',
  },
});
