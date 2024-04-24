package com.retenosdk;

import androidx.annotation.NonNull;
import com.google.gson.annotations.SerializedName;
import com.reteno.core.data.remote.model.recommendation.get.RecomBase;

public class RetenoRecommendationsResponse implements RecomBase {

  @SerializedName("productId")
  private final String productId;
  @SerializedName("descr")
  private final String descr;

  public RetenoRecommendationsResponse(String productId, String descr) {
    this.productId = productId;
    this.descr = descr;
  }

  @NonNull
  @Override
  public String getProductId() {
    return productId;
  }

  public String getDescr() {
    return descr;
  }
}
