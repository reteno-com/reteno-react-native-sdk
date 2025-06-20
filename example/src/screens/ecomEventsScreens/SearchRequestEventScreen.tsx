import React, {useState} from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import {logEcomEventSearchRequest} from 'reteno-react-native-sdk';
import styles from '../styles';

const SearchRequestEventScreen = () => {
  const [form, setFormValue] = useState({
    searchQuery: '',
    isFound: true,
  });

  const handleChange = (key: string, value: string | boolean) => {
    setFormValue(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEcomEvent = async () => {
    const {searchQuery, isFound} = form;
    try {
      const res = await logEcomEventSearchRequest({
        searchQuery,
        isFound,
      });
      Alert.alert(`Success ${JSON.stringify(res)}`);
    } catch (error) {
      Alert.alert(`error ${error}`);
      console.error('Error logging search request event:', error);
    }
  };

  const renderInputRow = ({
    label,
    value,
    onChange,
    required = false,
  }: {
    label: string;
    value: string;
    onChange: (text: string) => void;
    required?: boolean;
  }) => (
    <View style={styles.row} key={label}>
      <View style={styles.rowText}>
        <Text style={styles.text}>
          <Text style={styles.text}>{label}</Text>
          {required && <Text style={styles.rowTextRequired}>*</Text>}
        </Text>
      </View>
      <TextInput
        style={[styles.textInput, styles.text]}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );

  const renderSwitchRow = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
  }) => (
    <View style={styles.row} key={label}>
      <View style={styles.rowText}>
        <Text style={styles.text}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {renderInputRow({
          label: 'Search Query',
          value: form.searchQuery,
          onChange: text => handleChange('searchQuery', text),
          required: true,
        })}
        {renderSwitchRow({
          label: 'Is Found',
          value: form.isFound,
          onChange: value => handleChange('isFound', value),
        })}
        <TouchableOpacity style={styles.submitBtn} onPress={handleEcomEvent}>
          <Text style={styles.submitBtnText}>Log Search request event</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchRequestEventScreen;
