import React from 'react';
import styles from './styles';
import {SafeAreaView, ScrollView, Text, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ScreenNames} from '../config';

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
  const navigation = useNavigation();

  const goToScreen = (screenName: string) => {
    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {routes.map(item => (
          <TouchableOpacity
            key={item.route}
            style={styles.submitBtn}
            onPress={() => goToScreen(item.route)}>
            <Text style={styles.submitBtnText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EcomEventsScreen;
