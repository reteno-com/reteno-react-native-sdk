import React, { useCallback, useState, useMemo } from 'react';

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
import { logEvent } from 'reteno-react-native-sdk';

export default function Events() {
  const [eventName, setEventName] = useState('');
  const [parameterName, setParameterName] = useState('');
  const [parameterValue, setParameterValue] = useState('');
  const [parameters, setParameters] = useState<
    { name: string; value: string }[]
  >([]);
  const [showParameterForm, setShowParameterForm] = useState(false);

  const form = useMemo(
    () => [
      {
        required: true,
        label: 'Event name',
        value: eventName,
        onChange: setEventName,
      },
    ],
    [eventName]
  );

  const addParameter = useCallback(() => {
    if (parameterName && parameterValue) {
      setParameters([
        ...parameters,
        { name: parameterName, value: parameterValue },
      ]);
      setParameterName('');
      setParameterValue('');
      setShowParameterForm(false);
    }
  }, [parameterName, parameterValue, parameters]);

  const submit = useCallback(() => {
    if (eventName) {
      logEvent(eventName, new Date().toISOString(), parameters, false);
    } else {
      Alert.alert('Error', 'eventName is required for logEvent method');
    }
  }, [eventName, parameters]);
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
            <View style={styles.rowValue}>
              <TextInput
                style={[styles.textInput, styles.text]}
                value={item.value}
                onChangeText={item.onChange}
              />
            </View>
          </View>
        ))}
        {!!parameters.length && (
          <View style={[styles.row, styles.noBorderRow]}>
            <Text style={styles.text}>Parameters</Text>
          </View>
        )}
        {parameters.map((item) => (
          <View style={styles.row} key={item.name}>
            <View style={styles.rowText}>
              <Text style={styles.text}>
                <Text style={styles.text}>{item.name}</Text>
              </Text>
            </View>
            <View style={styles.rowValue}>
              <Text style={styles.text}>{item.value}</Text>
            </View>
          </View>
        ))}

        {showParameterForm ? (
          <>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.text}>
                  <Text style={styles.text}>Name</Text>
                  <Text style={styles.rowTextRequired}>*</Text>
                </Text>
              </View>
              <View style={styles.rowValue}>
                <TextInput
                  style={[styles.textInput, styles.text]}
                  value={parameterName}
                  onChangeText={setParameterName}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.text}>
                  <Text style={styles.text}>Value</Text>
                  <Text style={styles.rowTextRequired}>*</Text>
                </Text>
              </View>
              <View style={styles.rowValue}>
                <TextInput
                  style={[styles.textInput, styles.text]}
                  value={parameterValue}
                  onChangeText={setParameterValue}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={addParameter}>
              <Text style={styles.submitBtnText}>Add parameter</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => setShowParameterForm(true)}
          >
            <Text style={styles.submitBtnText}>New parameter</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.submitBtn} onPress={submit}>
        <Text style={styles.submitBtnText}>Send custom event</Text>
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
  section: {
    paddingLeft: 20,
  },
  row: {
    flexDirection: 'row',
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  noBorderRow: {
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 0.45,
    paddingVertical: 20,
  },
  rowTextRequired: {
    color: 'red',
  },
  rowValue: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 20,
  },
  textInput: {
    flex: 1,
    height: '100%',
    width: '100%',
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
