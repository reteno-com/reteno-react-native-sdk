import React from 'react';
import { SafeAreaView, ScrollView, Alert } from 'react-native';
import { getRecommendations, logRecommendationEvent } from 'reteno-react-native-sdk';
import { Button } from '../components/Button';
import styles from './styles';

export default function RecommendationsScreen() {
  const handleGetRecommendations = () => {
    const payload = {
      recomVariantId: 'r1107v1482',
      productIds: ['240-LV09', '24-WG080'],
      categoryId: '',
      filters: [],
      fields: ['productId', 'name', 'descr', 'imageUrl', 'price'],
    };

    getRecommendations(payload)
      .then(response =>
        Alert.alert('Recommendations received:', response ? JSON.stringify(response) : String(response)),
      )
      .catch(error =>
        Alert.alert('Error fetching recommendations:', error ? JSON.stringify(error) : String(error)),
      );
  };

  const handleLogRecommendationEvent = () => {
    const payload = {
      recomVariantId: 'r1107v1482',
      impressions: [{ productId: '240-LV09' }],
      clicks: [{ productId: '24-WG080' }],
      forcePush: true,
    };

    logRecommendationEvent(payload)
      .then(() => Alert.alert('Recommendation event logged successfully'))
      .catch(error =>
        Alert.alert('Error logging recommendation event:', error ? JSON.stringify(error) : String(error)),
      );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Button onPress={handleGetRecommendations} label="Get Recommendations" />
        <Button onPress={handleLogRecommendationEvent} label="Log Recommendation Event" />
      </ScrollView>
    </SafeAreaView>
  );
}
