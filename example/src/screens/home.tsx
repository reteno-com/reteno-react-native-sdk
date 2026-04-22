import React, { useCallback, useMemo } from 'react';
import { ScrollView, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenNames, RootStackParamList } from '../config';
import { Button } from '../components/Button';
import styles from './styles';

type Props = NativeStackScreenProps<RootStackParamList, ScreenNames.home>;

export default function Main({ navigation }: Props) {
  const goTo = useCallback(
    (routeName: ScreenNames) => {
      navigation.navigate(routeName);
    },
    [navigation],
  );

  const menuItems = useMemo(
    () => [
      { label: 'Attributes', route: ScreenNames.attributes },
      { label: 'Anonymous Attributes', route: ScreenNames.anonymousUserAttributes },
      { label: 'Events', route: ScreenNames.events },
      { label: 'Ecom Events', route: ScreenNames.ecomEvents },
      { label: 'Push Notifications', route: ScreenNames.pushNotifications },
      { label: 'In-App Messages', route: ScreenNames.inAppMessages },
      { label: 'App Inbox', route: ScreenNames.appInbox },
      { label: 'Recommendations', route: ScreenNames.recommendations },
    ],
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {menuItems.map(item => (
          <Button key={item.route} onPress={() => goTo(item.route)} label={item.label} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
