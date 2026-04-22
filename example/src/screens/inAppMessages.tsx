import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Alert, Platform, Text, View } from 'react-native';
import {
  pauseInAppMessages,
  setInAppMessagesPauseBehaviour,
  setInAppLifecycleCallback,
  removeInAppLifecycleCallback,
  beforeInAppDisplayHandler,
  onInAppDisplayHandler,
  beforeInAppCloseHandler,
  afterInAppCloseHandler,
  onInAppErrorHandler,
  addInAppMessageCustomDataHandler,
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

export default function InAppMessagesScreen() {
  const [subscriptionEvents, setSubscriptionEvents] = useState<SubscriptionEvent[]>([]);
  const [statusInfo, setStatusInfo] = useState<string>('No status changes yet');

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

  useEffect(() => {
    setInAppLifecycleCallback();

    const beforeInAppDisplayListener = beforeInAppDisplayHandler(data =>
      addSubscriptionEvent('beforeInAppDisplayHandler', data),
    );
    const onInAppDisplayListener = onInAppDisplayHandler(data =>
      addSubscriptionEvent('onInAppDisplayHandler', data),
    );
    const beforeInAppCloseListener = beforeInAppCloseHandler(data =>
      addSubscriptionEvent('beforeInAppCloseHandler', data),
    );
    const afterInAppCloseListener = afterInAppCloseHandler(data =>
      addSubscriptionEvent('afterInAppCloseHandler', data),
    );
    const onInAppErrorListener = onInAppErrorHandler(data =>
      addSubscriptionEvent('onInAppErrorHandler', data, 'error'),
    );
    const addInAppMessageCustomDataListener = addInAppMessageCustomDataHandler(data =>
      addSubscriptionEvent('addInAppMessageCustomDataHandler', data),
    );

    return () => {
      beforeInAppDisplayListener.remove();
      onInAppDisplayListener.remove();
      beforeInAppCloseListener.remove();
      afterInAppCloseListener.remove();
      onInAppErrorListener.remove();
      addInAppMessageCustomDataListener.remove();
      removeInAppLifecycleCallback();
    };
  }, [addSubscriptionEvent]);

  const handleInAppMessagesStatus = (isPaused: boolean) => {
    pauseInAppMessages(isPaused)
      .then(() => {
        if (isPaused) {
          setStatusInfo('In-app messages paused');
          return;
        }
        setStatusInfo('In-app messages unpaused');
      })
      .catch(error => Alert.alert('Error', String(error)));
  };

  const handleSetPauseBehaviour = (behaviour: InAppPauseBehaviour) => {
    setInAppMessagesPauseBehaviour(behaviour)
      .then(() => setStatusInfo(`Pause behaviour set to: ${behaviour}`))
      .catch(error => Alert.alert('Error', String(error)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>In-App Status</Text>
          <Text style={styles.eventsEmpty}>{statusInfo}</Text>
        </View>
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Lifecycle Events</Text>
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
          <Button onPress={() => setSubscriptionEvents([])} label="Clear events" />
        </View>
        <Button onPress={() => handleInAppMessagesStatus(true)} label="Pause in-app messages" />
        <Button onPress={() => handleInAppMessagesStatus(false)} label="Unpause in-app messages" />
        <Button
          onPress={() => handleSetPauseBehaviour('SKIP_IN_APPS')}
          label="Pause behaviour: Skip"
        />
        <Button
          onPress={() => handleSetPauseBehaviour('POSTPONE_IN_APPS')}
          label="Pause behaviour: Postpone"
        />
        <Button onPress={setInAppLifecycleCallback} label="Subscribe to lifecycle events" />
        {Platform.OS === 'android' && (
          <Button onPress={removeInAppLifecycleCallback} label="Unsubscribe from lifecycle events" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
