import React, {useState} from 'react';
import {
  SafeAreaView,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {logEcomEventProductAddedToWishlist} from 'reteno-react-native-sdk';
import styles from '../styles';
import {InputRow} from '../../components/InputRow';

const ProductAddedToWishlistEventScreen = () => {
  const [form, setFormValue] = useState({
    currencyCode: '',
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
    const {productId, price, isInStock, attributes, currencyCode} = form;
    logEcomEventProductAddedToWishlist({
      product: {
        productId,
        price: parseFloat(price),
        isInStock,
        attributes,
      },
      currencyCode: currencyCode ? currencyCode : null,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <InputRow
          label="Currency code"
          value={form.currencyCode}
          onChange={text => handleChange('currencyCode', text)}
          required
        />
        <InputRow
          label="Product ID"
          value={form.productId}
          onChange={text => handleChange('productId', text)}
          required
        />
        <InputRow
          label="Price"
          value={form.price}
          onChange={text => handleChange('price', text)}
          required
        />

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
            <InputRow
              label="Attribute Name"
              value={attr.name}
              onChange={text => handleAttributeChange(index, 'name', text)}
              required
            />
            <InputRow
              label="Attribute Value"
              value={attr.value[0] as string}
              onChange={text => handleAttributeChange(index, 'value', text)}
              required
            />
          </View>
        ))}
        <TouchableOpacity style={styles.submitBtn} onPress={handleEcomEvent}>
          <Text style={styles.submitBtnText}>
            Log Product Added to wishlist event
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductAddedToWishlistEventScreen;
