import React, {useState} from 'react';
import {
  SafeAreaView,
  Text,
  View,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import {logEcomEventSearchRequest} from 'reteno-react-native-sdk';
import styles from '../styles';
import { InputRow } from 'example/src/components/InputRow';
import { Button } from 'example/src/components/Button';

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
          <InputRow
            label="Search Query"
            value={form.searchQuery}
            onChange={text => handleChange('searchQuery', text)}
            required
          />
         <View style={styles.row} key='Is Found'> 
      <View style={styles.rowText}>
        <Text style={styles.text}>Is Found</Text>
      </View>
      <Switch value={form.isFound} onValueChange={value => handleChange('isFound', value)} />
    </View>
        <Button onPress={handleEcomEvent} label='Log Search request event' />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchRequestEventScreen;
