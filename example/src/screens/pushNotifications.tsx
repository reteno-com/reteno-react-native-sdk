import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Alert, Platform, Text, View } from 'react-native';
import {
  forcePushData,
  inApp,
  push,
} from 'reteno-react-native-sdk';
import type { InAppPauseBehaviour } from 'reteno-react-native-sdk';
import { Button } from '../components/Button';
import styles from './styles';

type SubscriptionEvent = {
  id: number;
  name: string;
  payload: string;
  level: 'info' | 'error';
};

export default function PushNotificationsScreen() {
  const [autoOpenLinksEnabled, setAutoOpenLinksEnabled] = useState<boolean>(true);
  const [subscriptionEvents, setSubscriptionEvents] = useState<SubscriptionEvent[]>([]);

  const addSubscriptionEvent = useCallback(
    (name: string, payload: unknown, level: SubscriptionEvent['level'] = 'info') => {
      const event: SubscriptionEvent = {
        id: Date.now() + Math.random(),
        name,
        payload: payload ? JSON.stringify(payload) : String(payload ?? ''),
        level,
      };
      setSubscriptionEvents(prev => [event, ...prev].slice(0, 20));
    },
    [],
  );

  const onRetenoPushReceived = useCallback(
    (event: unknown) => addSubscriptionEvent('onRetenoPushReceived', event),
    [addSubscriptionEvent],
  );

  const onRetenoPushClicked = useCallback(
    (event: unknown) => addSubscriptionEvent('onRetenoPushClicked', event),
    [addSubscriptionEvent],
  );

  const onRetenoPushButtonClicked = useCallback(
    (event: unknown) => addSubscriptionEvent('onRetenoPushButtonClicked', event),
    [addSubscriptionEvent],
  );

  useEffect(() => {
    inApp.getAutoOpenLinks().then(setAutoOpenLinksEnabled);
  }, []);

  useEffect(() => {
    push.getInitialNotification().then(data => {
      addSubscriptionEvent('getInitialNotification', data);
    });

    const pushListener = push.setOnReceivedListener(onRetenoPushReceived);
    const pushClickListener = push.setOnClickedListener(onRetenoPushClicked);
    const pushButtonClickListener = push.setOnButtonClickedListener(onRetenoPushButtonClicked);
    const pushDismissedListener = push.setOnDismissedListener(event =>
      addSubscriptionEvent('onRetenoPushDismissed', event),
    );
    const customPushListener = push.setOnCustomDataListener(event =>
      addSubscriptionEvent('onRetenoCustomPushData', event),
    );
    return () => {
      pushListener.remove();
      pushClickListener.remove();
      if (pushButtonClickListener) pushButtonClickListener.remove();
      if (pushDismissedListener) pushDismissedListener.remove();
      if (customPushListener) customPushListener.remove();
    };
  }, [onRetenoPushReceived, onRetenoPushClicked, onRetenoPushButtonClicked, addSubscriptionEvent]);

  const handleToggleAutoOpenLinks = () => {
    const newValue = !autoOpenLinksEnabled;
    inApp.setAutoOpenLinks(newValue)
      .then(() => {
        setAutoOpenLinksEnabled(newValue);
        Alert.alert('Success', `Auto open links: ${newValue ? 'enabled' : 'disabled'}`);
      })
      .catch(error => Alert.alert('Error', error));
  };

  const handleRequestNotificationPermission = () => {
    push.requestNotificationPermission()
      .then(granted => Alert.alert('Notification Permission', granted ? 'Granted' : 'Denied'))
      .catch(error => Alert.alert('Error', String(error)));
  };

  const handleGetNotificationPermissionStatus = () => {
    push.getNotificationPermissionStatus()
      .then(status => Alert.alert('Notification Permission Status', status))
      .catch(error => Alert.alert('Error', String(error)));
  };

  const handlePausePushInAppMessages = (isPaused: boolean) => {
    push.pauseTriggeredInAppMessages(isPaused)
      .then(() => Alert.alert('Success', `Push InApp pause state: ${isPaused}`))
      .catch(error => Alert.alert('Error', String(error)));
  };

  const handleSetPushInAppMessagesPauseBehaviour = (behaviour: InAppPauseBehaviour) => {
    push.setTriggeredInAppMessagesPauseBehaviour(behaviour)
      .then(() => Alert.alert('Success', `Push InApp pause behaviour: ${behaviour}`))
      .catch(error => Alert.alert('Error', String(error)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Subscription Events</Text>
          {subscriptionEvents.length === 0 ? (
            <Text style={styles.eventsEmpty}>No events yet</Text>
          ) : (
            subscriptionEvents.map(event => (
              <View key={event.id} style={styles.eventItem}>
                <Text style={event.level === 'error' ? styles.eventNameError : styles.eventName}>
                  {event.name}
                </Text>
                <Text style={styles.eventPayload}>{event.payload || 'empty payload'}</Text>
              </View>
            ))
          )}
          <Button onPress={() => setSubscriptionEvents([])} label="Clear subscription events" />
        </View>
        <Button onPress={forcePushData} label="Force push data" />
        <Button
          onPress={handleToggleAutoOpenLinks}
          label={`Auto open links: ${autoOpenLinksEnabled ? 'ON' : 'OFF'} (tap to toggle)`}
        />
        {Platform.OS === 'android' && (
          <Button onPress={handleRequestNotificationPermission} label="Request Notification Permission" />
        )}
        {Platform.OS === 'android' && (
          <Button onPress={handleGetNotificationPermissionStatus} label="Get Notification Permission Status" />
        )}
        {Platform.OS === 'android' && (
          <Button onPress={() => handlePausePushInAppMessages(true)} label="Pause push-triggered in-app" />
        )}
        {Platform.OS === 'android' && (
          <Button onPress={() => handlePausePushInAppMessages(false)} label="Unpause push-triggered in-app" />
        )}
        {Platform.OS === 'android' && (
          <Button
            onPress={() => handleSetPushInAppMessagesPauseBehaviour('SKIP_IN_APPS')}
            label="Push-triggered in-app behaviour: Skip"
          />
        )}
        {Platform.OS === 'android' && (
          <Button
            onPress={() => handleSetPushInAppMessagesPauseBehaviour('POSTPONE_IN_APPS')}
            label="Push-triggered in-app behaviour: Postpone"
          />
        )}
        {Platform.OS === 'ios' && (
          <Button onPress={push.registerForRemoteNotifications} label="Register for Remote Notifications" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
