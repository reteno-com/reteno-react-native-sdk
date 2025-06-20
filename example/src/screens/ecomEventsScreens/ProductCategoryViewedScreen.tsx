import React, {useState} from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {logEcomEventProductCategoryViewed} from 'reteno-react-native-sdk';
import styles from '../styles';

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {renderInputRow({
          label: 'Category ID',
          value: form.categoryId,
          onChange: text => handleChange('categoryId', text),
          required: true,
        })}
        {form.attributes.map((attr, index) => (
          <View key={index}>
            {renderInputRow({
              label: 'Attribute Name',
              value: attr.name,
              onChange: text => handleAttributeChange(index, 'name', text),
            })}
            {renderInputRow({
              label: 'Attribute Value',
              value: attr.value[0],
              onChange: text => handleAttributeChange(index, 'value', text),
            })}
          </View>
        ))}

        <TouchableOpacity style={styles.submitBtn} onPress={handleEcomEvent}>
          <Text style={styles.submitBtnText}>Log Product Viewed Event</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductCategoryViewedScreen;
