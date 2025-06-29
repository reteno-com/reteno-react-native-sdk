import React, {useCallback, useMemo, useEffect, useState} from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ScreenNames, RootStackParamList} from '../config';
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
  getAppInboxMessages,
  onUnreadMessagesCountChanged,
  markAsOpened,
  markAllAsOpened,
  unreadMessagesCountHandler,
  getAppInboxMessagesCount,
  unreadMessagesCountErrorHandler,
  unsubscribeMessagesCountChanged,
  unsubscribeAllMessagesCountChanged,
  setOnRetenoPushButtonClickedListener,
} from 'reteno-react-native-sdk';

type Props = NativeStackScreenProps<RootStackParamList, ScreenNames.home>;

export default function Main({navigation}: Props) {
  const [messagesId, setMessagesId] = useState<string>('');

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
    [],
  );

  const handleInAppMessagesStatus = (isPaused: boolean) => {
    pauseInAppMessages(isPaused)
      .then(() => {
        Alert.alert('Success', 'Pause state changed');
      })
      .catch(error => {
        Alert.alert('Error', error);
      });
  };

  const handleGetAppInboxMessagesCount = () => {
    getAppInboxMessagesCount()
      .then(response => {
        Alert.alert(
          'Success',
          response !== null ? JSON.stringify(response) : response,
        );
      })
      .catch(error => {
        Alert.alert('Error', error);
      });
  };

  const handleDownloadMessages = () => {
    getAppInboxMessages({})
      .then(response => {
        Alert.alert(
          'Success download messages',
          response ? JSON.stringify(response) : response,
        );
      })
      .catch(error => {
        Alert.alert('Error', error);
      });
  };

  const handleMarkAsOpened = () => {
    markAsOpened([messagesId])
      .then(response => {
        Alert.alert(
          'Success mark as opened',
          response ? JSON.stringify(response) : response,
        );
      })
      .catch(error => {
        Alert.alert('Error', error);
      });
  };

  const handleMarkAllAsOpened = () => {
    markAllAsOpened()
      .then(response => {
        Alert.alert(
          'Success mark all as opened',
          response ? JSON.stringify(response) : response,
        );
      })
      .catch(error => {
        Alert.alert('Error', error);
      });
  };

  const goTo = useCallback(
    (routeName: ScreenNames) => {
      navigation.navigate(routeName);
    },
    [navigation],
  );

  const onRetenoPushReceived = useCallback(event => {
    Alert.alert('onRetenoPushReceived', event ? JSON.stringify(event) : event);
  }, []);

  const onRetenoPushClicked = useCallback(event => {
    Alert.alert('onRetenoPushClicked', event ? JSON.stringify(event) : event);
  }, []);

  const onRetenoPushButtonClicked = useCallback(event => {
    Alert.alert(
      'onRetenoPushButtonClicked',
      event ? JSON.stringify(event) : event,
    );
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
      .then(response => {
        Alert.alert(
          'Recommendations received:',
          response ? JSON.stringify(response) : response,
        );
      })
      .catch(error => {
        Alert.alert(
          'Error fetching recommendations:',
          error ? JSON.stringify(error) : error,
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
      .catch(error => {
        Alert.alert(
          'Error logging recommendation event:',
          error ? JSON.stringify(error) : error,
        );
      });
  };

  useEffect(() => {
    getInitialNotification().then(data => {
      Alert.alert('getInitialNotification', data ? JSON.stringify(data) : data);
    });
    const pushListener = setOnRetenoPushReceivedListener(onRetenoPushReceived);
    const pushClickListener =
      setOnRetenoPushClickedListener(onRetenoPushClicked);
    const pushButtonClickListener = setOnRetenoPushButtonClickedListener(
      onRetenoPushButtonClicked,
    );

    return () => {
      pushListener.remove();
      pushClickListener.remove();
      if (pushButtonClickListener) pushButtonClickListener.remove();
    };
  }, [onRetenoPushReceived, onRetenoPushClicked, onRetenoPushButtonClicked]);

  useEffect(() => {
    const unreadMessagesCountListener = unreadMessagesCountHandler(data => {
      Alert.alert(
        'unreadMessagesCountHandler',
        data ? JSON.stringify(data) : data,
      );

      getAppInboxMessages({}).then(response => {
        const newMessagesIds: string[] = response?.messages
          ?.filter(el => el?.isNew)
          ?.sort(
            (a, b) =>
              new Date(b.createdDate).getTime() -
              new Date(a.createdDate).getTime(),
          )
          ?.map(el => el?.id);
        setMessagesId(newMessagesIds?.[0] ?? '');
      });
    });

    return () => {
      unreadMessagesCountListener.remove();
    };
  }, []);

  useEffect(() => {
    const unreadMessagesCountErrorListener = unreadMessagesCountErrorHandler(
      error =>
        Alert.alert(
          'unreadMessagesCountErrorHandler',
          error ? JSON.stringify(error) : error,
        ),
    );

    return () => {
      if (unreadMessagesCountErrorListener) {
        unreadMessagesCountErrorListener.remove();
      }
    };
  }, []);

  useEffect(() => {
    setInAppLifecycleCallback();

    const beforeInAppDisplayListener = beforeInAppDisplayHandler(data =>
      Alert.alert(
        'beforeInAppDisplayHandler',
        data ? JSON.stringify(data) : data,
      ),
    );
    const onInAppDisplayListener = onInAppDisplayHandler(data =>
      Alert.alert('onInAppDisplayHandler', data ? JSON.stringify(data) : data),
    );
    const beforeInAppCloseListener = beforeInAppCloseHandler(data =>
      Alert.alert(
        'beforeInAppCloseHandler',
        data ? JSON.stringify(data) : data,
      ),
    );
    const afterInAppCloseListener = afterInAppCloseHandler(data =>
      Alert.alert('afterInAppCloseHandler', data ? JSON.stringify(data) : data),
    );
    const onInAppErrorListener = onInAppErrorHandler(data =>
      Alert.alert(
        'beforeInAppDisplayHandler',
        data ? JSON.stringify(data) : data,
      ),
    );

    const addInAppMessageCustomDataListener = addInAppMessageCustomDataHandler(
      data =>
        Alert.alert(
          'addInAppMessageCustomDataHandler',
          data ? JSON.stringify(data) : data,
        ),
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
        {form.map(item => (
          <TouchableOpacity
            key={item.route}
            style={styles.submitBtn}
            onPress={() => goTo(item.route)}>
            <Text style={styles.submitBtnText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => goTo(ScreenNames.ecomEvents)}>
          <Text style={styles.submitBtnText}>ecom events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={forcePushData}>
          <Text style={styles.submitBtnText}>Force push data</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => handleInAppMessagesStatus(true)}>
          <Text style={styles.submitBtnText}>Pause in app messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => handleInAppMessagesStatus(false)}>
          <Text style={styles.submitBtnText}>Unpause in app messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={setInAppLifecycleCallback}>
          <Text style={styles.submitBtnText}>
            Subscribe to in app messages events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={removeInAppLifecycleCallback}>
          <Text style={styles.submitBtnText}>
            Unsubscribe from in app messages events (Android)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleGetRecommendations}>
          <Text style={styles.submitBtnText}>Get Recommendations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleLogRecommendationEvent}>
          <Text style={styles.submitBtnText}>Log Recommendations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={onUnreadMessagesCountChanged}>
          <Text style={styles.submitBtnText}>
            Subscribe on unread messages count event (Inbox)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={unsubscribeMessagesCountChanged}>
          <Text style={styles.submitBtnText}>
            Unsubscribe from unread messages count event (Inbox) (Android)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={unsubscribeAllMessagesCountChanged}>
          <Text style={styles.submitBtnText}>
            Unsubscribe from all unread messages count event (Inbox) (Android)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleGetAppInboxMessagesCount}>
          <Text style={styles.submitBtnText}>Get App Inbox Messages Count</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleDownloadMessages}>
          <Text style={styles.submitBtnText}>Download messages (Inbox)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleMarkAsOpened}>
          <Text style={styles.submitBtnText}>Mark as opened (Inbox)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleMarkAllAsOpened}>
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
