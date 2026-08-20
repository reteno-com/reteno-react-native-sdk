# Recommendations

> Every method below is also available grouped under the `recommendations` namespace (e.g. `recommendations.get`) — see [Namespaced API](../NamespacedAPI/README.md).

## Get Recommendations

You can personalize the user experience and increase sales by adding recommendations of your goods and services to your React Native app. The passed recommendations are based on customer activity data and include various options such as out of stock items, cross-selling, upselling, potential purchases, personal recommendations, and more.

```ts
import { getRecommendations } from "reteno-react-native-sdk";

/*
  recomVariantId: (string) The recommendation variant ID in the format "r{recomId}v{variantId}".
  productIds: (string[]) Array of product IDs for product-based algorithms.
  categoryId: (string) Category ID for category-based algorithms.
  filters (optional): ({ name: string; values: string[] }[]) Additional algorithm filters.
  fields: (string[]) Array of response model fields to include.
*/

// Note: filters is iOS-only today — the Android bridge does not read this field from the
// payload at all, so on Android the same call runs unfiltered.
const handleGetRecommendations = () => {
  const recommendationsPayload = {
    recomVariantId: "r1107v1482",
    productIds: ["240-LV09", "24-WG080"],
    categoryId: "",
    filters: [{ name: "color", values: ["red", "blue"] }],
    fields: ["productId", "name", "descr", "imageUrl", "price"],
  };

  getRecommendations(recommendationsPayload)
    .then((response) => {
      // Handle successful retrieval of recommendations
      console.log("Recommendations received:", response);
    })
    .catch((error) => {
      // Handle error
      console.error("Error fetching recommendations:", error);
    });
};
```

## Log Recommendation Event

You can track events related to showing user-specific product recommendations or user clicks on recommended products using this method.

```ts
import { logRecommendationEvent } from "reteno-react-native-sdk";

/*
  recomVariantId: (string) Recommendation variant ID in the format "r{recomId}v{variantId}".
  impressions: (RecommendationEvent[]) Array of events describing that a specific product recommendation was shown to a user.
  clicks: (RecommendationEvent[]) Array of events describing that a user clicked a specific product recommendation.
  forcePush (optional, only for iOS): (boolean) Indicates if the event should be sent immediately or in the next scheduled batch.
*/

const handleLogRecommendationEvent = () => {
  const recommendationEventPayload = {
    recomVariantId: "r1107v1482",
    impressions: [{ productId: "240-LV09" }],
    clicks: [{ productId: "24-WG080" }],
    forcePush: true,
  };

  logRecommendationEvent(recommendationEventPayload)
    .then(() => {
      // Handle successful logging of recommendation event
      console.log("Recommendation event logged successfully");
    })
    .catch((error) => {
      // Handle error
      console.error("Error logging recommendation event:", error);
    });
};
```
