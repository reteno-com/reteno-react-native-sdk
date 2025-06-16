 export const orderFields = [
    { key: 'externalOrderId', label: 'External Order ID', required: true },
    { key: 'externalCustomerId', label: 'External Customer ID' },
    { key: 'totalCost', label: 'Total Cost', keyboardType: 'decimal-pad', required: true },
    { key: 'status', label: 'Status', required: true},
    { key: 'cartId', label: 'Cart ID' },
    { key: 'email', label: 'Email', keyboardType: 'email-address' },
    { key: 'phone', label: 'Phone', keyboardType: 'phone-pad' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'shipping', label: 'Shipping', keyboardType: 'decimal-pad' },
    { key: 'discount', label: 'Discount', keyboardType: 'decimal-pad' },
    { key: 'taxes', label: 'Taxes', keyboardType: 'decimal-pad' },
    { key: 'restoreId', label: 'Restore ID' },
    { key: 'statusDescription', label: 'Status Description' },
    { key: 'storeId', label: 'Store ID' },
    { key: 'source', label: 'Source' },
    { key: 'deliveryMethod', label: 'Delivery Method' },
    { key: 'deliveryAddress', label: 'Delivery Address' },
    { key: 'paymentMethod', label: 'Payment Method' },
  ];

export const orderItemFields = [
    { key: 'externalItemId', label: 'External Item ID' },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Quantity', keyboardType: 'numeric' },
    { key: 'price', label: 'Price', keyboardType: 'decimal-pad' },
    { key: 'url', label: 'URL' },
    { key: 'imageUrl', label: 'Image URL' },
    { key: 'description', label: 'Description' },
  ];

 export const attributeFields = [
    { key: 'name', label: 'Attribute Name' },
    { key: 'value', label: 'Attribute Value' },
  ];