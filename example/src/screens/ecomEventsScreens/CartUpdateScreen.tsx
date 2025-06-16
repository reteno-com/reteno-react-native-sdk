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
import {logEcomEventCartUpdated} from 'reteno-react-native-sdk';
import styles from '../styles';

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
        price: parseFloat(item.price),
        discount: item.discount ? parseFloat(item.discount) : null,
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

  const renderInputRow = ({
    label,
    value,
    onChange,
    required = false,
    keyboardType = 'default',
  }: {
    label: string;
    value: string;
    onChange: (text: string) => void;
    required?: boolean;
    keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  }) => (
    <View style={styles.row} key={label}>
      <View style={styles.rowText}>
        <Text style={styles.text}>
          {label}
          {required && <Text style={styles.rowTextRequired}>*</Text>}
        </Text>
      </View>
      <TextInput
        style={[styles.textInput, styles.text]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
      />
    </View>
  );

  const cartItem = form.cartItems[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {renderInputRow({
          label: 'Currency code',
          value: form.currencyCode,
          onChange: text => handleChange('currencyCode', text),
        })}
        {renderInputRow({
          label: 'cartId',
          value: form.cartId,
          onChange: text => handleChange('cartId', text),
          required: true,
          keyboardType: 'decimal-pad',
        })}
        {renderInputRow({
          label: 'Product ID',
          value: cartItem?.productId ?? '',
          onChange: text => handleCartItemChange('productId', text),
          required: true,
        })}
        {renderInputRow({
          label: 'Quantity',
          value: cartItem?.quantity ?? '',
          onChange: text => handleCartItemChange('quantity', text),
          required: true,
          keyboardType: 'numeric',
        })}
        {renderInputRow({
          label: 'Price',
          value: cartItem?.price ?? '',
          onChange: text => handleCartItemChange('price', text),
          required: true,
          keyboardType: 'decimal-pad',
        })}
        {renderInputRow({
          label: 'Discount',
          value: cartItem?.discount ?? '',
          onChange: text => handleCartItemChange('discount', text),
          keyboardType: 'decimal-pad',
          required: true,
        })}
        {renderInputRow({
          label: 'Product Name',
          value: cartItem?.name ?? '',
          onChange: text => handleCartItemChange('name', text),
        })}
        {renderInputRow({
          label: 'Category',
          value: cartItem?.category ?? '',
          onChange: text => handleCartItemChange('category', text),
        })}

        <TouchableOpacity style={styles.submitBtn} onPress={handleEcomEvent}>
          <Text style={styles.submitBtnText}>Log Cart Updated Event</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CartUpdateScreen;
