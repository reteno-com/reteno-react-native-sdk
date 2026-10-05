import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Alert, Platform, Text, View } from 'react-native';
import {
  inApp,
} from 'reteno-react-native-sdk';
import type { InAppPauseBehaviour } from 'reteno-react-native-sdk';
import { Button } from '../components/Button';
import { useLinkEventMonitor } from '../LinkEventMonitor';
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
  const { events: linkEvents, clearEvents: clearLinkEvents } = useLinkEventMonitor();

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
    inApp.setLifecycleCallback();

    const beforeInAppDisplayListener = inApp.beforeDisplay(data =>
      addSubscriptionEvent('beforeInAppDisplayHandler', data),
    );
    const onInAppDisplayListener = inApp.onDisplay(data =>
      addSubscriptionEvent('onInAppDisplayHandler', data),
    );
    const beforeInAppCloseListener = inApp.beforeClose(data =>
      addSubscriptionEvent('beforeInAppCloseHandler', data),
    );
    const afterInAppCloseListener = inApp.afterClose(data =>
      addSubscriptionEvent('afterInAppCloseHandler', data),
    );
    const onInAppErrorListener = inApp.onError(data =>
      addSubscriptionEvent('onInAppErrorHandler', data, 'error'),
    );
    return () => {
      beforeInAppDisplayListener.remove();
      onInAppDisplayListener.remove();
      beforeInAppCloseListener.remove();
      afterInAppCloseListener.remove();
      onInAppErrorListener.remove();
      inApp.removeLifecycleCallback();
    };
  }, [addSubscriptionEvent]);

  const handleInAppMessagesStatus = (isPaused: boolean) => {
    inApp.pauseMessages(isPaused)
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
    inApp.setPauseBehaviour(behaviour)
      .then(() => setStatusInfo(`Pause behaviour set to: ${behaviour}`))
      .catch(error => Alert.alert('Error', String(error)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Link Source Test (custom-data links)</Text>
          <Text style={styles.eventsEmpty}>
            Test a direct push link, a display-rules in-app link, and a
            push-triggered in-app link. Events are captured globally, including
            queued cold-start events.
          </Text>
          {Platform.OS === 'android' ? (
            <Text style={styles.sourceValue}>
              Android test setup: add at least one custom-data field to the
              in-app link action (for example, link_source_test=true). The
              native Android SDK opens URL-only actions without emitting the
              custom-data callback used by this test.
            </Text>
          ) : null}
          {linkEvents.length === 0 ? (
            <Text style={styles.eventsEmpty}>
              No custom-data link events received yet
            </Text>
          ) : (
            linkEvents.map(event => (
              <View key={event.id} style={styles.eventItem}>
                <Text style={styles.eventName}>Received: {event.receivedAt}</Text>
                <Text style={styles.sourceValue}>
                  source: {event.data.source ?? 'not provided'}
                </Text>
                <Text style={styles.eventPayload}>
                  inapp_source: {event.data.inapp_source ?? 'not provided'}
                </Text>
                <Text style={styles.eventPayload}>
                  url: {event.data.url ?? 'not provided'}
                </Text>
                <Text style={styles.eventPayload}>
                  customData: {JSON.stringify(event.data.customData ?? {})}
                </Text>
                <Text style={styles.eventPayload}>
                  payload: {JSON.stringify(event.data)}
                </Text>
              </View>
            ))
          )}
          <Text style={styles.eventsEmpty}>
            Expected: an iOS direct push link → pushNotification; a link inside
            an in-app on either platform → inAppMessage. Android direct push
            clicks are shown on the Push Notifications screen. An Android
            push-triggered in-app link has source=inAppMessage and
            inapp_source=PUSH_NOTIFICATION.
          </Text>
          <Button onPress={clearLinkEvents} label="Clear link events" />
        </View>
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
        <Button onPress={inApp.setLifecycleCallback} label="Subscribe to lifecycle events" />
        {Platform.OS === 'android' && (
          <Button onPress={inApp.removeLifecycleCallback} label="Unsubscribe from lifecycle events" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
