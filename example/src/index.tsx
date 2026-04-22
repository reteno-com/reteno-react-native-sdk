import * as React from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  logScreenView,
  registerForRemoteNotifications,
  updatePushPermissionStatusAndroid,
} from 'reteno-react-native-sdk';
import AttributesScreen from './screens/attributes';
import EventsScreen from './screens/events';
import HomeScreen from './screens/home';
import AnonymousUserAttributes from './screens/anonymousUserAttributes';
import { ScreenNames, RootStackParamList } from './config';
import { PermissionsAndroid } from 'react-native';
import EcomEventsScreen from './screens/ecomEvents';
import PushNotificationsScreen from './screens/pushNotifications';
import InAppMessagesScreen from './screens/inAppMessages';
import AppInboxScreen from './screens/appInbox';
import RecommendationsScreen from './screens/recommendations';
import ViewedEventScreen from './screens/ecomEventsScreens/viewedEventScreen';
import ProductCategoryViewedScreen from './screens/ecomEventsScreens/ProductCategoryViewedScreen';
import ProductAddedToWishlistEventScreen from './screens/ecomEventsScreens/ProductAddedToWishlistEventScreen';
import CartUpdateScreen from './screens/ecomEventsScreens/CartUpdateScreen';
import OrderCreatedScreen from './screens/ecomEventsScreens/OrderCreatedEventScreen';
import SearchRequestEventScreen from './screens/ecomEventsScreens/SearchRequestEventScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

type NavigationProps = {
  appVersion?: string;
};

function Navigation({ appVersion }: NavigationProps) {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    registerForRemoteNotifications();
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS!
      ).then((result) => {
        if (result === 'granted') {
          updatePushPermissionStatusAndroid().then((status) => {
            console.log('update status', status);
          });
        }
      });
    }
  }, []);

  return (
    <KeyboardAvoidingView
      enabled={Platform.OS === 'ios'}
      behavior="padding"
      style={styles.container}
    >
      <NavigationContainer
        ref={navigationRef}
        onReady={async () => {
          routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
          const currentRouteName =
            navigationRef.current?.getCurrentRoute()?.name;
          await logScreenView(currentRouteName ?? '');
        }}
        onStateChange={async () => {
          const previousRouteName = routeNameRef.current;
          const currentRouteName =
            navigationRef.current?.getCurrentRoute()?.name;
          if (previousRouteName !== currentRouteName) {
            await logScreenView(currentRouteName ?? '');
          }
          routeNameRef.current = currentRouteName;
        }}
      >
        <Stack.Navigator
          initialRouteName={ScreenNames.home}
          screenOptions={{
            headerRight: () =>
              appVersion ? <Text style={styles.versionText}>{String(appVersion)}</Text> : null,
          }}
        >
          <Stack.Screen name={ScreenNames.home} component={HomeScreen} />
          <Stack.Screen
            name={ScreenNames.ecomEvents}
            component={EcomEventsScreen}
          />
          <Stack.Screen
            name={ScreenNames.ViewedEventScreen}
            component={ViewedEventScreen}
          />
          <Stack.Screen
            name={ScreenNames.ProductCategoryViewedScreen}
            component={ProductCategoryViewedScreen}
          />
          <Stack.Screen
            name={ScreenNames.ProductAddedToWishlistEventScreen}
            component={ProductAddedToWishlistEventScreen}
          />
          <Stack.Screen
            name={ScreenNames.SearchRequestEventScreen}
            component={SearchRequestEventScreen}
          />
          <Stack.Screen
            name={ScreenNames.CartUpdateScreenEventScreen}
            component={CartUpdateScreen}
          />
          <Stack.Screen
            name={ScreenNames.OrderCreatedScreen}
            component={OrderCreatedScreen}
          />
          <Stack.Screen
            name={ScreenNames.attributes}
            component={AttributesScreen}
          />
          <Stack.Screen name={ScreenNames.events} component={EventsScreen} />
          <Stack.Screen
            name={ScreenNames.anonymousUserAttributes}
            component={AnonymousUserAttributes}
          />
          <Stack.Screen
            name={ScreenNames.pushNotifications}
            component={PushNotificationsScreen}
          />
          <Stack.Screen
            name={ScreenNames.inAppMessages}
            component={InAppMessagesScreen}
          />
          <Stack.Screen
            name={ScreenNames.appInbox}
            component={AppInboxScreen}
          />
          <Stack.Screen
            name={ScreenNames.recommendations}
            component={RecommendationsScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  versionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default Navigation;
