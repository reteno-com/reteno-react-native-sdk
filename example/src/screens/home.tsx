import React, { useCallback, useMemo } from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenNames, RootStackParamList } from '../config';

type Props = NativeStackScreenProps<RootStackParamList, ScreenNames.home>;

export default function Main({ navigation }: Props) {
  const form = useMemo(
    () => [
      {
        label: 'Attributes',
        route: ScreenNames.attributes,
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
