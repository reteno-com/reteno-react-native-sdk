export enum ScreenNames {
  home = 'Home',
  attributes = 'Attributes',
  events = 'Events',
  anonymousUserAttributes = 'AnonymousUserAttributes',
  ecomEvents = 'EcomEvents',
  ViewedEventScreen = 'ViewedEventScreen',
  ProductCategoryViewedScreen = 'ProductCategoryViewedScreen',
  ProductAddedToWishlistEventScreen = 'ProductAddedToWishlistEventScreen',
  CartUpdateScreenEventScreen = 'CartUpdateScreenEventScreen',
  OrderCreatedScreen = 'OrderCreatedScreen',
  SearchRequestEventScreen = 'SearchRequestEventScreen',
}

export type RootStackParamList = {
  [ScreenNames.home]: undefined;
  [ScreenNames.attributes]: undefined;
  [ScreenNames.events]: undefined;
  [ScreenNames.anonymousUserAttributes]: undefined;
  [ScreenNames.ecomEvents]: undefined;
  [ScreenNames.ViewedEventScreen]: undefined;
  [ScreenNames.ProductCategoryViewedScreen]: undefined;
  [ScreenNames.ProductAddedToWishlistEventScreen]: undefined;
  [ScreenNames.CartUpdateScreenEventScreen]: undefined;
  [ScreenNames.OrderCreatedScreen]: undefined;
  [ScreenNames.SearchRequestEventScreen]: undefined;
};
