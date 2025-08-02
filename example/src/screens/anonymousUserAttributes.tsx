import React, {useCallback, useState, useMemo} from 'react';

import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  setAnonymousUserAttributes,
  AnonymousUserAttributes,
} from 'reteno-react-native-sdk';
import styles from './styles';
import { Button } from '../components/Button';

export default function AnonymousUserAttributesScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [languageCode, setLanguageCode] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [region, setRegion] = useState('');
  const [town, setTown] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');

  const form = useMemo(
    () => [
      {label: 'Firstname', value: firstName, onChange: setFirstName},
      {label: 'Lastname', value: lastName, onChange: setLastName},
      {
        label: 'Language code',
        value: languageCode,
        onChange: setLanguageCode,
      },
      {
        label: 'Time zone',
        value: timeZone,
        onChange: setTimeZone,
      },
      {
        label: 'Region',
        value: region,
        onChange: setRegion,
      },
      {
        label: 'Town',
        value: town,
        onChange: setTown,
      },
      {
        label: 'Address',
        value: address,
        onChange: setAddress,
      },
      {
        label: 'Postcode',
        value: postcode,
        onChange: setPostcode,
      },
    ],
    [
      firstName,
      lastName,
      languageCode,
      timeZone,
      region,
      town,
      address,
      postcode,
    ],
  );

  const submit = useCallback(() => {
    let payload: AnonymousUserAttributes = {};
    if (firstName || lastName || languageCode || timeZone) {
      payload = {
        ...payload,
        firstName,
        lastName,
        languageCode,
        timeZone,
      };
    }
    if (region || town || address || postcode) {
      payload.address = {
        region,
        town,
        address,
        postcode,
      };
    }

    setAnonymousUserAttributes(payload)
      .then(() => {
        Alert.alert('Success', 'Anonymous attributes sent');
      })
      .catch(error => {
        Alert.alert('Error', error);
      });
  }, [
    firstName,
    lastName,
    languageCode,
    timeZone,
    region,
    town,
    address,
    postcode,
  ]);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {form.map(item => (
          <View style={styles.row} key={item.label}>
            <View style={styles.rowText}>
              <Text style={styles.text}>
                <Text style={styles.text}>{item.label}</Text>
              </Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.text]}
              value={item.value}
              onChangeText={item.onChange}
            />
          </View>
        ))}
      </ScrollView>
      <Button onPress={submit} label='Set Anonymous User Attributes' />
    </SafeAreaView>
  );
}
