import * as React from 'react';
import { KeyboardAvoidingView, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerForRemoteNotifications } from 'reteno-react-native-sdk';
import AttributesScreen from './screens/attributes';
import EventsScreen from './screens/events';
import HomeScreen from './screens/home';
import { ScreenNames, RootStackParamList } from './config';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  React.useEffect(() => {
    registerForRemoteNotifications();
  }, []);

  return (
    <KeyboardAvoidingView
      enabled={Platform.OS === 'ios'}
      behavior="padding"
      style={styles.container}
    >
      <NavigationContainer>
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