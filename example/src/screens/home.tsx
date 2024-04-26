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
  getRecommendations,
  logRecommendationEvent,
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
