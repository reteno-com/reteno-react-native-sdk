import React, {useState} from 'react';
import {
  SafeAreaView,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardType,
} from 'react-native';
import {logEcomEventCartUpdated} from 'reteno-react-native-sdk';
import styles from '../styles';
import { InputRow } from 'example/src/components/InputRow';
import { cartItemFields } from 'example/src/utils/data';

const CartUpdateScreen = () => {
  const [form, setFormValue] = useState({
    currencyCode: '',
    cartId: '',
    cartItems: [
      {
        productId: '',
        quantity: '',
        price: '',
        discount: '',
        name: '',
        category: '',
      },
    ],
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setFormValue(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCartItemChange = (
    key: keyof (typeof form.cartItems)[0],
    value: string,
  ) => {
    setFormValue(prev => {
      const updatedCartItems = [...prev.cartItems];
      if (updatedCartItems[0]) {
        updatedCartItems[0] = {
          ...updatedCartItems[0],
          [key]: value,
        };
      }
      return {
        ...prev,
        cartItems: updatedCartItems,
      };
    });
  };

  const validateRequiredFields = () => {
    const {cartItems} = form;
    const cartItem = cartItems[0];

    if (!cartItem?.productId.trim()) {
      Alert.alert('Помилка валідації', 'Поле "Product ID" є обов\'язковим');
      return false;
    }

    if (!cartItem?.quantity.trim()) {
      Alert.alert('Помилка валідації', 'Поле "Quantity" є обов\'язковим');
      return false;
    }

    if (!cartItem?.price.trim()) {
      Alert.alert('Помилка валідації', 'Поле "Price" є обов\'язковим');
      return false;
    }

    if (isNaN(parseInt(cartItem.quantity))) {
      Alert.alert(
        'Помилка валідації',
        'Поле "Quantity" повинно бути цілим числом',
      );
      return false;
    }

    if (isNaN(parseFloat(cartItem.price))) {
      Alert.alert('Помилка валідації', 'Поле "Price" повинно бути числом');
      return false;
    }

    return true;
  };

  const handleEcomEvent = async () => {
    if (!validateRequiredFields()) {
      return;
    }

    try {
      const {currencyCode, cartId, cartItems} = form;

      const cartItemsFormatted = cartItems.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity, 10),
        price: Number(item.price),
        discount: item.discount ? Number(item.discount) : null,
        name: item.name || null,
        category: item.category || null,
      }));

      const res = await logEcomEventCartUpdated({
        cartItems: cartItemsFormatted,
        cartId,
        currencyCode: currencyCode || null,
      });

      Alert.alert(`Success ${JSON.stringify(res)}`);
    } catch (error) {
      Alert.alert('Error', `Failed to log event: ${error}`);
    }
  };

  const cartItem = form.cartItems[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <InputRow
            label='Currency code'
            value={form.currencyCode}
            onChange={text =>
              handleChange('currencyCode', text)
            }
          />
        <InputRow
            label='cartId'
            value={form.cartId}
            onChange={text =>
              handleChange('cartId', text)
            }
            keyboardType='decimal-pad'
          />

          {cartItemFields.map(field => (
            <InputRow
              key={field.key}
              label={field.label}
              value={cartItem?.[field.key as keyof typeof cartItem] ?? ''}
              onChange={text => handleCartItemChange(field.key as keyof typeof cartItem, text)}
              required={field.required}
              keyboardType={field.keyboardType as KeyboardType}
            />
        ))}
        <TouchableOpacity style={styles.submitBtn} onPress={handleEcomEvent}>
          <Text style={styles.submitBtnText}>Log Cart Updated Event</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CartUpdateScreen;
