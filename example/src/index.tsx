import * as React from 'react';
import { KeyboardAvoidingView, StyleSheet, Platform } from 'react-native';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  logScreenView,
  registerForRemoteNotifications,
} from 'reteno-react-native-sdk';
import AttributesScreen from './screens/attributes';
import EventsScreen from './screens/events';
import HomeScreen from './screens/home';
import { ScreenNames, RootStackParamList } from './config';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = React.useRef<string | undefined>();

  React.useEffect(() => {
    registerForRemoteNotifications();
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
        <Stack.Navigator initialRouteName={ScreenNames.home}>
          <Stack.Screen name={ScreenNames.home} component={HomeScreen} />
          <Stack.Screen
            name={ScreenNames.attributes}
            component={AttributesScreen}
          />
          <Stack.Screen name={ScreenNames.events} component={EventsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });

export default Navigation;
