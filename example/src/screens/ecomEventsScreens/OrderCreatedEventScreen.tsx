import React, {useState} from 'react';
import {
  SafeAreaView,
  Text,
  ScrollView,
  Alert,
  KeyboardType,
} from 'react-native';
import styles from '../styles';
import {
  EcomOrder,
  EcomOrderItem,
  EcomSimpleAttribute,
  logEcomEventOrderCancelled,
  logEcomEventOrderCreated,
  logEcomEventOrderDelivered,
  logEcomEventOrderUpdated,
  OrderStatus,
} from 'reteno-react-native-sdk';
import {attributeFields, orderFields, orderItemFields} from '../../utils/data';
import {InputRow} from '../../components/InputRow';
import { Button } from '../../components/Button';

interface FormState {
  currencyCode: string;
  order: EcomOrder;
}

const OrderCreatedScreen = () => {
  const [form, setFormValue] = useState<FormState>({
    currencyCode: '',
    order: {
      externalOrderId: '',
      externalCustomerId: '',
      totalCost: 0,
      status: OrderStatus.Initialized,
      cartId: '',
      email: '',
      phone: '',
      firstName: '',
      lastName: '',
      shipping: 0,
      discount: 0,
      taxes: 0,
      restoreId: '',
      statusDescription: '',
      storeId: '',
      source: '',
      deliveryMethod: '',
      deliveryAddress: '',
      paymentMethod: '',
      orderItems: [
        {
          externalItemId: '',
          name: '',
          category: '',
          quantity: 0,
          price: 0,
          url: '',
          imageUrl: '',
          description: '',
        },
      ],
      attributes: [
        {
          name: '',
          value: '',
        },
      ],
    },
  });

  const handleOrderChange = (key: keyof EcomOrder, value: string) => {
    setFormValue(prev => ({
      ...prev,
      order: {
        ...prev.order,
        [key]: value,
      },
    }));
  };

  const handleOrderItemChange = (key: keyof EcomOrderItem, value: string) => {
    setFormValue(prev => {
      const updatedOrderItems = [...prev.order.orderItems];
      if (updatedOrderItems[0]) {
        updatedOrderItems[0] = {
          ...updatedOrderItems[0],
          [key]: value,
        };
      }
      return {
        ...prev,
        order: {
          ...prev.order,
          orderItems: updatedOrderItems,
        },
      };
    });
  };

  const handleAttributeChange = (
    index: number,
    field: 'name' | 'value',
    value: string,
  ) => {
    setFormValue(prev => {
      const attributes = [...prev.order.attributes];
      if (attributes[index]) {
        attributes[index] = {
          ...attributes[index],
          [field]: value,
        };
      }
      return {
        ...prev,
        order: {
          ...prev.order,
          attributes,
        },
      };
    });
  };

  const validateRequiredFields = () => {
    const {order} = form;

    if (!order.externalOrderId.trim()) {
      Alert.alert(
        'Помилка валідації',
        'Поле "External Order ID" є обов\'язковим',
      );
      return false;
    }

    return true;
  };

  const parseOrderStatus = (statusString: string): OrderStatus | null => {
    if (!statusString.trim()) return null;

    switch (statusString.toLowerCase()) {
      case 'initialized':
      case '0':
        return OrderStatus.Initialized;
      case 'inprogress':
      case 'in progress':
      case '1':
        return OrderStatus.InProgress;
      case 'delivered':
      case '2':
        return OrderStatus.Delivered;
      case 'cancelled':
      case '3':
        return OrderStatus.Cancelled;
      default:
        return OrderStatus.Initialized;
    }
  };

  const formatOrderData = (): EcomOrder => {
    const {order} = form;

    const hasValidOrderItems = order?.orderItems?.some(item =>
      item.externalItemId.trim(),
    );
    const hasValidAttributes = order?.attributes?.some(attr =>
      attr.name.trim(),
    );

    const orderItems: EcomOrderItem[] | null = hasValidOrderItems
      ? order
          .orderItems!.filter(item => item.externalItemId.trim())
          .map(item => ({
            externalItemId: item.externalItemId,
            name: item.name,
            category: item.category,
            quantity: Number(item.quantity) || 0,
            price: Number(item.price) || 0,
            url: item.url,
            imageUrl: item.imageUrl || null,
            description: item.description || null,
          }))
      : null;

    const attributes: EcomSimpleAttribute[] | null = hasValidAttributes
      ? order?.attributes
          ?.filter(attr => attr.name.trim())
          ?.map(attr => ({
            name: attr.name,
            value: attr.value,
          })) || null
      : null;

    return {
      externalOrderId: order.externalOrderId,
      externalCustomerId: order.externalCustomerId || null,
      totalCost: order.totalCost ? Number(order.totalCost) : 0,
      status: parseOrderStatus(order.status) || 1,
      cartId: order.cartId || null,
      email: order.email || null,
      phone: order.phone || null,
      firstName: order.firstName || null,
      lastName: order.lastName || null,
      shipping: Number(order.shipping) || null,
      discount: Number(order.discount) || null,
      taxes: Number(order.taxes) || null,
      restoreId: order.restoreId || null,
      statusDescription: order.statusDescription || null,
      storeId: order.storeId || null,
      source: order.source || null,
      deliveryMethod: order.deliveryMethod || null,
      deliveryAddress: order.deliveryAddress || null,
      paymentMethod: order.paymentMethod || null,
      orderItems,
      attributes,
    };
  };

  const handleEcomOrderCreatedEvent = async () => {
    if (!validateRequiredFields()) {
      return;
    }

    const {currencyCode} = form;

    const orderData = formatOrderData();

    try {
      const res = await logEcomEventOrderCreated({
        order: orderData,
        currencyCode,
      });

      Alert.alert(`Успіх: ${JSON.stringify(res)}`);
    } catch (error) {
      Alert.alert(
        'Помилка',
        `Не вдалося зареєструвати подію: ${JSON.stringify(error)}`,
      );
      console.log('Error logging order created event:', JSON.stringify(error));
    }
  };

  const handleEcomOrderUpdatedEvent = async () => {
    if (!validateRequiredFields()) {
      return;
    }

    const {currencyCode} = form;
    const orderData = formatOrderData();
    try {
      const res = await logEcomEventOrderUpdated({
        order: orderData,
        currencyCode,
      });
      Alert.alert(`Успіх: ${JSON.stringify(res)}`);
    } catch (error) {
      Alert.alert('Помилка', `Не вдалося оновити подію: ${error}`);
    }
  };

  const handleEcomOrderDeliveredEvent = async () => {
    if (!form.order.externalOrderId.trim()) {
      Alert.alert(
        'Помилка валідації',
        'Поле "External Order ID" є обов\'язковим',
      );
      return;
    }
    try {
      const res = await logEcomEventOrderDelivered({
        externalOrderId: form.order.externalOrderId,
      });

      Alert.alert(`Успіх: ${JSON.stringify(res)}`);
    } catch (error) {
      Alert.alert('Помилка', `Не вдалося зареєструвати подію: ${error}`);
    }
  };

  const handleEcomOrderCancelledEvent = () => {
    if (!form.order.externalOrderId.trim()) {
      Alert.alert(
        'Помилка валідації',
        'Поле "External Order ID" є обов\'язковим',
      );
      return;
    }

    logEcomEventOrderCancelled({
      externalOrderId: form.order.externalOrderId,
    });
  };

  const orderItem = form.order.orderItems?.[0];
  const attribute = form.order.attributes?.[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <InputRow
          label="Currency code"
          value={form.currencyCode}
          onChange={text => setFormValue({...form, currencyCode: text})}
        />

        {orderFields.map(({key, label, required, keyboardType}) => (
          <InputRow
            label={label}
            value={form.order[key as keyof typeof form.order] as string}
            onChange={text =>
              handleOrderChange(key as keyof typeof form.order, text)
            }
            required={required}
            keyboardType={keyboardType as KeyboardType}
          />
        ))}

        <Text style={[styles.text, {marginTop: 20, fontWeight: 'bold'}]}>
          Order Item
        </Text>

        {orderItemFields.map(({key, label, keyboardType}) => (
          <InputRow
            label={label}
            value={orderItem?.[key as keyof typeof orderItem] as string}
            onChange={text =>
              handleOrderItemChange(key as keyof typeof orderItem, text)
            }
            keyboardType={keyboardType as KeyboardType}
          />
        ))}

        <Text style={[styles.text, {marginTop: 20, fontWeight: 'bold'}]}>
          Attribute
        </Text>

        {attributeFields.map(({key, label}) => (
          <InputRow
            label={label}
            value={attribute?.[key as keyof typeof attribute] as string}
            onChange={text =>
              handleAttributeChange(0, key as 'name' | 'value', text)
            }
          />
        ))}
        <Button onPress={handleEcomOrderCreatedEvent} label='Log Order Created Event' />
        <Button onPress={handleEcomOrderUpdatedEvent} label='Log Order Updated Event' />
        <Button onPress={handleEcomOrderDeliveredEvent} label='Log Order Delivered Event' />
        <Button onPress={handleEcomOrderCancelledEvent} style={{marginBottom: 76}} label='Log Order Cancelled Event' />
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderCreatedScreen;
