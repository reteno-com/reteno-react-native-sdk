import React, { useCallback, useEffect, useState, useMemo } from 'react';

import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  setUserAttributes,
  UserAttributes,
  setOnRetenoPushReceivedListener,
  getInitialNotification,
} from 'reteno-react-native-sdk';

export default function Attributes() {
  const [externalUserId, setExternalUserId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+380');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [languageCode, setLanguageCode] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [region, setRegion] = useState('');
  const [town, setTown] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const onRetenoPushReceived = useCallback((event) => {
    Alert.alert('onRetenoPushReceived', event ? JSON.stringify(event) : event);
  }, []);

  useEffect(() => {
    getInitialNotification().then((data) => {
      Alert.alert('getInitialNotification', data ? JSON.stringify(data) : data);
    });
    const pushListener = setOnRetenoPushReceivedListener(onRetenoPushReceived);
    return () => pushListener.remove();
  }, [onRetenoPushReceived]);

  const form = useMemo(
    () => [
      {
        required: true,
        label: 'External User Id',
        value: externalUserId,
        onChange: setExternalUserId,
      },
      { label: 'Email', value: email, onChange: setEmail },
      { label: 'Phone', value: phone, onChange: setPhone },
      { label: 'Firstname', value: firstName, onChange: setFirstName },
      { label: 'Lastname', value: lastName, onChange: setLastName },
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
      externalUserId,
      email,
      phone,
      firstName,
      lastName,
      languageCode,
      timeZone,
      region,
      town,
      address,
      postcode,
    ]
  );

  const submit = useCallback(() => {
    if (externalUserId) {
      const payload: {
        externalUserId: string;
        user: {
          userAttributes?: UserAttributes;
        };
      } = {
        externalUserId,
        user: {},
      };
      if (email || phone || firstName || lastName || languageCode || timeZone) {
        payload.user = {
          ...payload.user,
          userAttributes: {
            email,
            phone,
            firstName,
            lastName,
            languageCode,
            timeZone,
          },
        };
      }
      if (region || town || address || postcode) {
        if (!payload.user.userAttributes) {
          payload.user.userAttributes = {};
        }
        payload.user.userAttributes.address = {
          region,
          town,
          address,
          postcode,
        };
      }

      setUserAttributes(payload)
        .then(() => {
          Alert.alert('Success', 'Attributes sent');
        })
        .catch((error) => {
          Alert.alert('Error', error);
        });
    }
  }, [
    externalUserId,
    email,
    phone,
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
        {form.map((item) => (
          <View style={styles.row} key={item.label}>
            <View style={styles.rowText}>
              <Text style={styles.text}>
                <Text style={styles.text}>{item.label}</Text>
                {item.required && <Text style={styles.rowTextRequired}>*</Text>}
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
      <TouchableOpacity style={styles.submitBtn} onPress={submit}>
        <Text style={styles.submitBtnText}>Set User Attributes</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  rowText: {
    flex: 0.45,
    paddingVertical: 20,
  },
  rowTextRequired: {
    color: 'red',
  },
  textInput: {
    flex: 1,
    height: '100%',
  },
  submitBtn: {
    borderColor: '#EBEBEB',
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    paddingVertical: 20,
  },
  submitBtnText: {
    color: '#000',
  },
  text: {
    color: '#000',
  },
});
