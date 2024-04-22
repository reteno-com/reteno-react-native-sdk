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

  const goTo = useCallback(
    (routeName: ScreenNames) => {
      navigation.navigate(routeName);
    },
    [navigation]
  );

  const onRetenoPushReceived = useCallback((event) => {
    Alert.alert('onRetenoPushReceived', event ? JSON.stringify(event) : event);
  }, []);

  useEffect(() => {
    getInitialNotification().then((data) => {
      Alert.alert('getInitialNotification', data ? JSON.stringify(data) : data);
    });
    const pushListener = setOnRetenoPushReceivedListener(onRetenoPushReceived);
    return () => pushListener.remove();
  }, [onRetenoPushReceived]);

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
