# Ecommerce Activity Tracking

> Every method below is also available grouped under the `ecommerce` namespace (e.g. `ecommerce.orderCreated`) — see [Namespaced API](../NamespacedAPI/README.md).

Reteno's e-commerce tracking allows you to understand customer behavior and use this data for analytics and automation.

This guide shows how to track e-commerce activity in your **React Native** application using specific logging methods from the SDK.

```ts
import {
  logEcomEventProductViewed,
  logEcomEventProductCategoryViewed,
  logEcomEventProductAddedToWishlist,
  logEcomEventCartUpdated,
  logEcomEventOrderCreated,
  logEcomEventOrderUpdated,
  logEcomEventOrderDelivered,
  logEcomEventOrderCancelled,
  logEcomEventSearchRequest,
  OrderStatus,
} from "reteno-react-native-sdk";
```

---

## Supported Events

| **Function**                         | **When to use it**                                  |
| ------------------------------------ | --------------------------------------------------- |
| `logEcomEventProductViewed`          | User opens a product card                           |
| `logEcomEventProductCategoryViewed`  | User opens a category or listing page               |
| `logEcomEventProductAddedToWishlist` | User adds a product to wishlist                     |
| `logEcomEventCartUpdated`            | Cart items changed (add / remove / quantity update) |
| `logEcomEventOrderCreated`           | New order is created                                |
| `logEcomEventOrderUpdated`           | Order is updated after creation                     |
| `logEcomEventOrderDelivered`         | Order marked as **DELIVERED**                       |
| `logEcomEventOrderCancelled`         | Order marked as **CANCELLED**                       |
| `logEcomEventSearchRequest`          | User performs a search query                        |

---

## Usage Pattern

1. Construct the appropriate payload object.
2. Pass it to the corresponding log function.
3. Await the result.

```ts
await logEcomEventProductViewed({
  product: {
    productId: "PRODUCT_ID",
    price: 99.99,
    isInStock: true,
    attributes: [
      { name: "color", value: ["red"] },
      { name: "size", value: ["M"] },
    ],
  },
  currencyCode: "USD",
});
```

---

## Event Reference

### Product Viewed

```ts
await logEcomEventProductViewed({
  product: {
    productId: "123",
    price: 29.99,
    isInStock: true,
    attributes: [{ name: "color", value: ["blue", "white"] }],
  },
  currencyCode: "EUR",
});
```

| Field        | Type              | Description                            |
| ------------ | ----------------- | -------------------------------------- |
| product      | `EcomProductView` | Required product object                |
| currencyCode | `string?`         | Optional ISO‑4217 code (e.g. USD, EUR) |

---

### Product Category Viewed

```ts
await logEcomEventProductCategoryViewed({
  category: {
    productCategoryId: "CATEGORY_01",
    attributes: [{ name: "gender", value: ["women"] }],
  },
});
```

| Field             | Type               | Description                  |
| ----------------- | ------------------ | ---------------------------- |
| productCategoryId | `string`           | Required category identifier |
| attributes        | `EcomAttribute[]?` | Optional metadata fields     |

---

### Product Added to Wishlist

```ts
await logEcomEventProductAddedToWishlist({
  product: {
    productId: "abc",
    price: 59.99,
    isInStock: true,
    attributes: [],
  },
  currencyCode: "UAH",
});
```

Same structure as **Product Viewed**.

---

### Cart Updated

```ts
await logEcomEventCartUpdated({
  cartId: "CART-123",
  cartItems: [
    {
      productId: "p1",
      quantity: 2,
      price: 25.0,
      discount: 5.0,
    },
    {
      productId: "p2",
      quantity: 1,
      price: 100.0,
    },
  ],
  currencyCode: "USD",
});
```

| Field        | Type             | Description                |
| ------------ | ---------------- | -------------------------- |
| cartId       | `string`         | Shopping cart ID           |
| cartItems    | `EcomCartItem[]` | Array of cart item details |
| currencyCode | `string?`        | Optional currency          |

---

### Order Created / Updated

```ts
await logEcomEventOrderCreated({
  order: {
    externalOrderId: "ORDER-999",
    totalCost: 200,
    status: OrderStatus.Initialized,
    cartId: "CART-123",
    externalCustomerId: "user-001",
  },
  currencyCode: "USD",
});
```

| Field           | Type          | Description                                           |
| --------------- | ------------- | ----------------------------------------------------- |
| externalOrderId | `string`      | Your system's order ID                                |
| totalCost       | `number`      | Total amount charged                                  |
| status          | `OrderStatus` | One of: Initialized, InProgress, Delivered, Cancelled |
| cartId          | `string?`     | Related cart ID (optional)                            |
| currencyCode    | `string?`     | ISO‑4217 currency code                                |

---

### Order Delivered / Cancelled

```ts
await logEcomEventOrderDelivered({ externalOrderId: "ORDER-999" });

await logEcomEventOrderCancelled({ externalOrderId: "ORDER-999" });
```

---

### Search Request

```ts
await logEcomEventSearchRequest({
  searchQuery: "running shoes",
  isFound: true,
});
```

| Field       | Type      | Description                |
| ----------- | --------- | -------------------------- |
| searchQuery | `string`  | What the user searched for |
| isFound     | `boolean` | Whether results were found |

---

## Currency Codes

Always use valid [ISO‑4217](https://en.wikipedia.org/wiki/ISO_4217) currency codes:

- `USD`
- `EUR`
- `UAH`

If no code is provided, your organization's default will be used.
