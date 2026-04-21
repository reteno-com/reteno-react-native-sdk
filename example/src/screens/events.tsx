import React, {useCallback, useState, useMemo} from 'react';

import {
  StyleSheet,
  View,
  TextInput,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {logEvent} from 'reteno-react-native-sdk';
import { Button } from '../components/Button';

type EventMessage = {
  id: number;
  type: 'success' | 'error';
  text: string;
};

export default function Events() {
  const [eventName, setEventName] = useState('test_event_type');
  const [parameterName, setParameterName] = useState('');
  const [parameterValue, setParameterValue] = useState('');
  const [parameters, setParameters] = useState<{name: string; value: string}[]>(
    [],
  );
  const [showParameterForm, setShowParameterForm] = useState(false);
  const [messages, setMessages] = useState<EventMessage[]>([]);

  const form = useMemo(
    () => [
      {
        required: true,
        label: 'Event name',
        value: eventName,
        onChange: setEventName,
      },
    ],
    [eventName],
  );

  const addParameter = useCallback(() => {
    if (parameterName && parameterValue) {
      setParameters([
        ...parameters,
        {name: parameterName, value: parameterValue},
      ]);
      setParameterName('');
      setParameterValue('');
      setShowParameterForm(false);
    }
  }, [parameterName, parameterValue, parameters]);

  const addMessage = useCallback((type: EventMessage['type'], text: string) => {
    setMessages(prev => [{id: Date.now() + Math.random(), type, text}, ...prev].slice(0, 5));
  }, []);

  const submit = useCallback(() => {
    if (eventName) {
      logEvent(eventName, new Date().toISOString(), parameters, false)
        .then(() => {
          addMessage('success', 'Success: Event sent');
        })
        .catch((error: any) => {
          const errorMessage =
            typeof error === 'string'
              ? error
              : error?.message
                ? error.message
                : JSON.stringify(error);
          addMessage('error', `Error: ${errorMessage}`);
        });
    } else {
      addMessage('error', 'Error: eventName is required for logEvent method');
    }
  }, [addMessage, eventName, parameters]);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.messagesContainer}>
          <Text style={styles.messagesTitle}>Messages</Text>
          {messages.length === 0 ? (
            <Text style={styles.messageEmpty}>No messages yet</Text>
          ) : (
            messages.map(message => (
              <Text
                key={message.id}
                style={[
                  styles.messageText,
                  message.type === 'success' ? styles.messageSuccess : styles.messageError,
                ]}>
                {message.text}
              </Text>
            ))
          )}
        </View>
        {form.map(item => (
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
        {parameters.map(item => (
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
            <Button onPress={addParameter} label='Add parameter' />
          </>
        ) : (
          <Button onPress={() => setShowParameterForm(true)} label='New parameter' />
        )}
      </ScrollView>
      <Button onPress={submit} label='Send custom event' />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'center',
  },
  messagesContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  messagesTitle: {
    color: '#000',
    fontWeight: '600',
    marginBottom: 8,
  },
  messageEmpty: {
    color: '#6B7280',
  },
  messageText: {
    marginBottom: 6,
  },
  messageSuccess: {
    color: '#0A7A33',
  },
  messageError: {
    color: '#B42318',
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
  text: {
    color: '#000',
  },
});
