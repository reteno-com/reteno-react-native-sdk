package com.retenosdk;

import static com.reteno.core.domain.model.ecom.EcomEvent.CartUpdated;
import static com.reteno.core.domain.model.ecom.EcomEvent.OrderCancelled;
import static com.reteno.core.domain.model.ecom.EcomEvent.OrderCreated;
import static com.reteno.core.domain.model.ecom.EcomEvent.OrderDelivered;
import static com.reteno.core.domain.model.ecom.EcomEvent.OrderUpdated;
import static com.reteno.core.domain.model.ecom.EcomEvent.ProductAddedToWishlist;
import static com.reteno.core.domain.model.ecom.EcomEvent.ProductCategoryViewed;
import static com.reteno.core.domain.model.ecom.EcomEvent.ProductViewed;
import static com.reteno.core.domain.model.ecom.EcomEvent.SearchRequest;

import android.util.Pair;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.reteno.core.domain.model.ecom.Attributes;
import com.facebook.react.bridge.ReadableType;
import com.reteno.core.domain.model.ecom.Order;
import com.reteno.core.domain.model.ecom.OrderItem;
import com.reteno.core.domain.model.ecom.OrderStatus;
import com.reteno.core.domain.model.ecom.ProductCategoryView;
import com.reteno.core.domain.model.ecom.ProductInCart;
import com.reteno.core.domain.model.ecom.ProductView;

import java.time.ZonedDateTime;
import java.util.ArrayList;

import javax.annotation.Nullable;

public class RetenoEcomEvent {

  @Nullable
  static Attributes buildAttributesFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    String name = RetenoUtil.getStringOrNull(payload.getString("name"));
    ReadableArray value = payload.getArray("value");
    ArrayList<String> values = new ArrayList<>();
    if (value != null) {
      for (int i = 0; i < value.size(); i++) {
        values.add(value.getString(i));
      }
    }
    if (name == null) return null;

    return new Attributes(
      name,
      values
    );
  }

  @Nullable
  static Pair<String, String> buildSimpleAttributesFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    String name = RetenoUtil.getStringOrNull(payload.getString("name"));
    String value = RetenoUtil.getStringOrNull(payload.getString("value"));
    if (name == null || value == null) return null;

    return new Pair<>(
      name,
      value
    );
  }

  @Nullable
  static ProductView buildProductFromPayload(ReadableMap payload) {

    if (payload == null) return null;
    String productId = payload.getString("productId");
    if (productId == null) return null;
    double price = payload.getDouble("price");
    boolean isInStock = payload.getBoolean("isInStock");
    ReadableArray attributes = payload.getArray("attributes");
    ArrayList<Attributes> attrList = new ArrayList<>();
    Attributes attr;

    if (attributes != null) {
      for (int i = 0; i < attributes.size(); i++) {
        attr = buildAttributesFromPayload(attributes.getMap(i));
        if (attr != null) {
          attrList.add(attr);
        }
      }
    }

    return new ProductView(
      productId,
      price,
      isInStock,
      attrList
    );
  }

  @Nullable
  static ProductViewed buildProductViewedFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    ProductView productView = buildProductFromPayload(payload.getMap("product"));
    if (productView == null) return null;
    String currencyCode = RetenoUtil.getStringOrNull(payload.getString("currencyCode"));

    return new ProductViewed(
      productView,
      currencyCode
    );
  }

  @Nullable
  public static ProductCategoryViewed buildProductCategoryViewedFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    ProductCategoryView categoryView = buildProductCategoryFromPayload(payload.getMap("category"));
    if (categoryView == null) return null;

    return new ProductCategoryViewed(categoryView);
  }

  @Nullable
  private static ProductCategoryView buildProductCategoryFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    String productCategoryId = payload.getString("productCategoryId");
    if (productCategoryId == null) return null;
    ReadableArray attributesArray = payload.getArray("attributes");
    ArrayList<Attributes> attributesList = null;
    Attributes attr;

    if (attributesArray != null) {
      attributesList = new ArrayList<>();
      for (int i = 0; i < attributesArray.size(); i++) {
        attr = buildAttributesFromPayload(attributesArray.getMap(i));
        if (attr != null) {
          attributesList.add(attr);
        }
      }
    }

    return new ProductCategoryView(
      productCategoryId,
      attributesList
    );
  }

  @Nullable
  public static ProductAddedToWishlist buildProductAddedToWishlistFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    ProductView productView = buildProductFromPayload(payload.getMap("product"));
    if (productView == null) return null;
    String currencyCode = payload.getString("currencyCode");

    return new ProductAddedToWishlist(
      productView,
      currencyCode
    );
  }

  @Nullable
  public static CartUpdated buildCartUpdatedFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    String cartId = payload.getString("cartId");
    if (cartId == null) return null;
    ReadableArray products = payload.getArray("cartItems");
    if (products == null) return null;
    ArrayList<ProductInCart> productList = new ArrayList<>();

    for (int i = 0; i < products.size(); i++) {
      ProductInCart item = buildCartItemFromPayload(products.getMap(i));
      if (item != null) {
        productList.add(item);
      }
    }

    String currencyCode = payload.getString("currencyCode");

    return new CartUpdated(
      cartId,
      productList,
      currencyCode
    );
  }

  @Nullable
  static ProductInCart buildCartItemFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    String productId = payload.getString("productId");
    if (productId == null) return null;
    int quantity = payload.getInt("quantity");
    double price = payload.getDouble("price");
    Double discount = payload.getDouble("discount");
    String name = payload.getString("name");
    String category = payload.getString("category");

    ReadableArray attributesArray = payload.getArray("attributes");
    ArrayList<Attributes> attributesList = null;
    Attributes attr;

    if (attributesArray != null) {
      attributesList = new ArrayList<>();
      for (int i = 0; i < attributesArray.size(); i++) {
        attr = buildAttributesFromPayload(attributesArray.getMap(i));
        if (attr != null) {
          attributesList.add(attr);
        }
      }
    }

    return new ProductInCart(
      productId,
      quantity,
      price,
      discount,
      name,
      category,
      attributesList
    );
  }

  @Nullable
  public static OrderCreated buildOrderCreatedFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    Order order = buildOrderFromPayload(payload.getMap("order"));
    if (order == null) return null;
    String currencyCode = payload.getString("currencyCode");

    return new OrderCreated(
      order,
      currencyCode
    );
  }

  private static Double getSafeDouble(ReadableMap payload, String key) {
    if (payload.getType(key) == ReadableType.Number) {
    
    return payload.getDouble(key);
  } else {
    return null;
  }
}

@Nullable
  private static Order buildOrderFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    String externalOrderId = payload.getString("externalOrderId");
    if (externalOrderId == null) return null;
    String externalCustomerId = payload.getString("externalCustomerId");
    double totalCost = payload.getDouble("totalCost");
    OrderStatus status = OrderStatus.values()[payload.getInt("status")];
    String cartId = payload.getString("cartId");
    String email = payload.getString("email");
    String phone = payload.getString("phone");
    String name = payload.getString("firstName");
    String lastName = payload.getString("lastName");
    Double shipping = getSafeDouble(payload, "shipping");
    Double discount = getSafeDouble(payload, "discount");
    Double taxes = getSafeDouble(payload, "taxes");
    String restoreId = payload.getString("restoreId");
    String statusDescription = payload.getString("statusDescription");
    String storeId = payload.getString("storeId");
    String source = payload.getString("source");
    String deliveryMethod = payload.getString("deliveryMethod");
    String paymentMethod = payload.getString("paymentMethod");
    String deliveryAddress = payload.getString("deliveryAddress");
    ReadableArray orderItems = payload.getArray("orderItems");
    ArrayList<OrderItem> orderItemList = null;
    if (orderItems != null) {
      orderItemList = new ArrayList<>();
      for (int i = 0; i < orderItems.size(); i++) {
        OrderItem item = buildOrderItemFromPayload(orderItems.getMap(i));
        if (item != null) {
          orderItemList.add(item);
        }
      }
    }


    ReadableArray attributes = payload.getArray("attributes");
    ArrayList<Pair<String, String>> attrPairs = null;

    if (attributes != null) {
      attrPairs = new ArrayList<>();
      for (int i = 0; i < attributes.size(); i++) {
        Pair<String, String> pair = buildSimpleAttributesFromPayload(attributes.getMap(i));
        if (pair != null) {
          attrPairs.add(pair);
        }
      }
    }


    return new Order(
      externalOrderId,
      externalCustomerId,
      totalCost,
      status,
      ZonedDateTime.now(),
      cartId,
      email,
      phone,
      name,
      lastName,
      shipping,
      discount,
      taxes,
      restoreId,
      statusDescription,
      storeId,
      source,
      deliveryMethod,
      paymentMethod,
      deliveryAddress,
      orderItemList,
      attrPairs
    );
  }

  @Nullable
  static OrderItem buildOrderItemFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    String externalItemId = payload.getString("externalItemId");
    if (externalItemId == null) return null;
    String name = payload.getString("name");
    if (name == null) return null;
    String category = payload.getString("category");
    if (category == null) return null;
    int quantity = payload.getInt("quantity");
    double price = payload.getDouble("price");
    String url = payload.getString("url");
    if (url == null) return null;
    String imageUrl = payload.getString("imageUrl");
    String description = payload.getString("description");


    return new OrderItem(
      externalItemId,
      name,
      category,
      quantity,
      price,
      url,
      imageUrl,
      description
    );
  }

  @Nullable
  public static OrderUpdated buildOrderUpdatedFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    Order order = buildOrderFromPayload(payload.getMap("order"));
    if (order == null) return null;
    String currencyCode = payload.getString("currencyCode");

    return new OrderUpdated(
      order,
      currencyCode
    );
  }

  @Nullable
  public static OrderDelivered buildOrderDeliveredFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    String externalOrderId = payload.getString("externalOrderId");
    if (externalOrderId == null) return null;

    return new OrderDelivered(
      externalOrderId
    );
  }

  @Nullable
  public static OrderCancelled buildOrderCancelledFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    String externalOrderId = payload.getString("externalOrderId");
    if (externalOrderId == null) return null;

    return new OrderCancelled(
      externalOrderId
    );
  }

  @Nullable
  public static SearchRequest buildSearchRequestFromPayload(ReadableMap payload) {
    if (payload == null) return null;
    String search = payload.getString("searchQuery");
    if (search == null) return null;
    boolean isFound = payload.getBoolean("isFound");


    return new SearchRequest(
      search,
      isFound
    );
  }
}