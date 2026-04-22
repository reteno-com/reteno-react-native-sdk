import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Alert, Text, View } from 'react-native';
import {
  getAppInboxMessages,
  getAppInboxMessagesCount,
  markAsOpened,
  markAllAsOpened,
  onUnreadMessagesCountChanged,
  unreadMessagesCountHandler,
  unreadMessagesCountErrorHandler,
  unsubscribeMessagesCountChanged,
  unsubscribeAllMessagesCountChanged,
} from 'reteno-react-native-sdk';
import { Button } from '../components/Button';
import styles from './styles';

type SubscriptionEvent = {
  id: number;
  name: string;
  payload: string;
  level: 'info' | 'error';
};

export default function AppInboxScreen() {
  const [messagesId, setMessagesId] = useState<string>('');
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

  useEffect(() => {
    const unreadCountListener = unreadMessagesCountHandler(data => {
      addSubscriptionEvent('unreadMessagesCountHandler', data);

      getAppInboxMessages({}).then(response => {
        const newMessagesIds: string[] = response?.messages
          ?.filter(el => el?.isNew)
          ?.sort(
            (a, b) =>
              new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
          )
          ?.map(el => el?.id);
        setMessagesId(newMessagesIds?.[0] ?? '');
      });
    });

    return () => {
      unreadCountListener.remove();
    };
  }, [addSubscriptionEvent]);

  useEffect(() => {
    const unreadCountErrorListener = unreadMessagesCountErrorHandler(error =>
      addSubscriptionEvent('unreadMessagesCountErrorHandler', error, 'error'),
    );

    return () => {
      if (unreadCountErrorListener) {
        unreadCountErrorListener.remove();
      }
    };
  }, [addSubscriptionEvent]);

  const handleGetMessagesCount = () => {
    getAppInboxMessagesCount()
      .then(response =>
        Alert.alert('Success', response !== null ? JSON.stringify(response) : String(response)),
      )
      .catch(error => Alert.alert('Error', error));
  };

  const handleDownloadMessages = () => {
    getAppInboxMessages({})
      .then(response =>
        Alert.alert('Success', response ? JSON.stringify(response) : String(response)),
      )
      .catch(error => Alert.alert('Error', error));
  };

  const handleMarkAsOpened = () => {
    markAsOpened([messagesId])
      .then(response =>
        Alert.alert('Success mark as opened', response ? JSON.stringify(response) : String(response)),
      )
      .catch(error => Alert.alert('Error', error));
  };

  const handleMarkAllAsOpened = () => {
    markAllAsOpened()
      .then(response =>
        Alert.alert('Success mark all as opened', response ? JSON.stringify(response) : String(response)),
      )
      .catch(error => Alert.alert('Error', error));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>Unread Count Events</Text>
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
        <Button onPress={handleGetMessagesCount} label="Get App Inbox Messages Count" />
        <Button onPress={handleDownloadMessages} label="Download messages" />
        <Button onPress={handleMarkAsOpened} label="Mark as opened" />
        <Button onPress={handleMarkAllAsOpened} label="Mark all as opened" />
        <Button onPress={onUnreadMessagesCountChanged} label="Subscribe on unread messages count" />
        <Button onPress={unsubscribeMessagesCountChanged} label="Unsubscribe from unread messages count" />
        <Button onPress={unsubscribeAllMessagesCountChanged} label="Unsubscribe from all unread messages count" />
      </ScrollView>
    </SafeAreaView>
  );
}
