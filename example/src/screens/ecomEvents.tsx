import React from 'react';
import styles from './styles';
import {SafeAreaView, ScrollView} from 'react-native';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList, ScreenNames} from '../config';
import { Button } from '../components/Button';

const routes = [
  {
    route: ScreenNames.ViewedEventScreen,
    title: 'Product Viewed',
  },
  {
    route: ScreenNames.ProductCategoryViewedScreen,
    title: 'Product Category Viewed Event',
  },
  {
    route: ScreenNames.ProductAddedToWishlistEventScreen,
    title: 'Product Added To Wishlist Event',
  },
  {
    route: ScreenNames.CartUpdateScreenEventScreen,
    title: 'Cart Updated Event',
  },
  {
    route: ScreenNames.OrderCreatedScreen,
    title: 'Order Events',
  },
  {
    route: ScreenNames.SearchRequestEventScreen,
    title: 'Search Request Event',
  },
];

const EcomEventsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const goToScreen = (screenName: keyof RootStackParamList) => {
    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {routes.map(item => (
          <Button key={item.route} onPress={() => goToScreen(item.route)} label={item.title} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EcomEventsScreen;
