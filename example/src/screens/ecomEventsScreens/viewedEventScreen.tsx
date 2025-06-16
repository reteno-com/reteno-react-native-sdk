import React, {useState} from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import {logEcomEventProductViewed} from 'reteno-react-native-sdk';
import styles from '../styles';

const ViewedEventScreen = () => {
  const [form, setFormValue] = useState({
    productId: '',
    price: '',
    isInStock: false,
    attributes: [
      {
        name: '',
        value: [''],
      },
    ],
  });

  const handleChange = (key: string, value: string | boolean) => {
    setFormValue(prev => ({
      ...prev,
      [key]: value,
    }));
  };

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

  const handleEcomEvent = () => {
    const {productId, price, isInStock, attributes} = form;

    logEcomEventProductViewed({
      product: {
        productId,
        price: parseFloat(price),
        isInStock,
        attributes,
      },
    });
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
          label: 'Product ID',
          value: form.productId,
          onChange: text => handleChange('productId', text),
          required: true,
        })}

        {renderInputRow({
          label: 'Price',
          value: form.price,
          onChange: text => handleChange('price', text),
          required: true,
        })}

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.text}>
              Is In Stock
              <Text style={styles.rowTextRequired}>*</Text>
            </Text>
          </View>
          <Switch
            value={form.isInStock}
            onValueChange={val => handleChange('isInStock', val)}
          />
        </View>

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

export default ViewedEventScreen;
