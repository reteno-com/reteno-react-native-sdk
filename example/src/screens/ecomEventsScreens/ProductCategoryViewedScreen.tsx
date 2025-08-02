import React, {useState} from 'react';
import {
  SafeAreaView,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import {logEcomEventProductCategoryViewed} from 'reteno-react-native-sdk';
import styles from '../styles';
import { InputRow } from 'example/src/components/InputRow';
import { Button } from 'example/src/components/Button';

const ProductCategoryViewedScreen = () => {
  const [form, setFormValue] = useState({
    categoryId: '',
    attributes: [
      {
        name: '',
        value: [''],
      },
    ],
  });

  const handleAttributeChange = (
    index: number,
    field: 'name' | 'value',
    value: string,
  ) => {
    setFormValue(prev => {
      const updatedAttributes = [...prev.attributes];
      if (updatedAttributes[index]) {
        if (field === 'value') {
          updatedAttributes[index].value = [value];
        } else {
          updatedAttributes[index].name = value;
        }
      }
      return {
        ...prev,
        attributes: updatedAttributes,
      };
    });
  };
  const handleChange = (key: string, value: string | boolean) => {
    setFormValue(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEcomEvent = async () => {
    const {categoryId, attributes} = form;

    try {
      if (!categoryId) {
        return Alert.alert(
          'Помилка валідації',
          'Обовязкові поля з "Category ID" повинно бути цілим заповнені',
        );
      }
      const res = await logEcomEventProductCategoryViewed({
        category: {
          productCategoryId: categoryId,
          attributes,
        },
      });
      Alert.alert(`Success ${JSON.stringify(res)}`);
    } catch (error) {
      Alert.alert(`Error ${JSON.stringify(error)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
          <InputRow
            label="Category ID"
            value={form.categoryId}
            onChange={text => handleChange('categoryId', text)}
            required
          />
        {form.attributes.map((attr, index) => (
          <View key={index}>
             <InputRow
                label="Attribute Name"
                value={attr.name}
                onChange={text => handleAttributeChange(index, 'name', text)}
              />
                <InputRow
                label="Attribute Value"
                value={attr.value[0]!}
                onChange={text => handleAttributeChange(index, 'value', text)}
              />
          </View>
        ))}

        <Button onPress={handleEcomEvent} label='Log Product Viewed Event' />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductCategoryViewedScreen;
