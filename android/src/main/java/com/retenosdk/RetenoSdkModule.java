package com.retenosdk;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.reteno.core.RetenoApplication;
import com.reteno.core.data.remote.model.recommendation.get.Recoms;
import com.reteno.core.domain.model.user.User;
import com.reteno.core.domain.model.user.UserAttributesAnonymous;
import com.reteno.core.domain.model.recommendation.get.RecomRequest;
import com.reteno.core.domain.model.recommendation.post.RecomEvent;
import com.reteno.core.domain.model.recommendation.post.RecomEventType;
import com.reteno.core.domain.model.recommendation.post.RecomEvents;
import com.reteno.core.view.iam.callback.InAppData;
import com.reteno.core.view.iam.callback.InAppCloseData;
import com.reteno.core.view.iam.callback.InAppErrorData;
import com.reteno.core.view.iam.callback.InAppLifecycleCallback;
import com.reteno.core.features.recommendation.GetRecommendationResponseCallback;


import java.util.ArrayList;
import java.util.List;
import java.time.ZonedDateTime;

public class RetenoSdkModule extends ReactContextBaseJavaModule {
  public static final String NAME = "RetenoSdk";
  ReactApplicationContext context;

  public RetenoSdkModule(ReactApplicationContext reactContext) {
    super(reactContext);
    context = reactContext;
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void setDeviceToken(String deviceToken, Promise promise) {
  }

  @ReactMethod
  public void setUserAttributes(ReadableMap payload, Promise promise) {
    String externalUserId = payload.getString("externalUserId");
    User user = RetenoUserAttributes.buildUserFromPayload(payload);
    if (externalUserId == null) {
      promise.reject("Parsing error", "externalUserId cannot be null");
      return;
    }

    try {
      ((RetenoApplication) this.context.getCurrentActivity().getApplication())
        .getRetenoInstance()
        .setUserAttributes(externalUserId, user);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK Error", e);
      return;
    }


    WritableMap res = new WritableNativeMap();
    res.putBoolean("success", true);

    promise.resolve(res);
  }

  public static void onRetenoPushReceived(Context context, Intent intent) {
    ReactContext reactContext = ((RetenoReactNativeApplication) context.getApplicationContext())
      .getReactContext();

    if (reactContext != null) {
      reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("reteno-push-received", parseIntent(intent));
    }
  }

  public static void onRetenoPushClicked(Context context, Intent intent) {
    ReactContext reactContext = ((RetenoReactNativeApplication) context.getApplicationContext())
      .getReactContext();

    if (reactContext != null) {
      reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("reteno-push-clicked", parseIntent(intent));
    }
  }

  private static WritableMap parseIntent(Intent intent){
    WritableMap params;
    Bundle extras = intent.getExtras();
    if (extras != null) {
      try {
        params = Arguments.fromBundle(extras);
      } catch (Exception e){
        params = Arguments.createMap();
      }
    } else {
      params = Arguments.createMap();
    }

    return params;
  }

  @ReactMethod
  public void getInitialNotification(Promise promise){
    Activity activity = getCurrentActivity();
    if(activity == null){
      promise.resolve(null);
      return;
    }
    promise.resolve(parseIntent(activity.getIntent()));
  }

  @ReactMethod
  public void logEvent(ReadableMap payload, Promise promise) {
    try {
      ((RetenoApplication) this.context.getCurrentActivity().getApplication())
        .getRetenoInstance()
        .logEvent(RetenoEvent.buildEventFromPayload(payload));
    } catch (Exception e) {
      promise.reject("Reteno Android SDK Error", e);
      return;
    }

    WritableMap res = new WritableNativeMap();
    res.putBoolean("success", true);
    promise.resolve(res);
  }

  @ReactMethod
  public void setAnonymousUserAttributes(ReadableMap payload, Promise promise) {

    UserAttributesAnonymous anonymousUser = RetenoUserAttributes.buildAnonymousUserFromPayload(payload);

    try {
      ((RetenoApplication) this.context.getCurrentActivity().getApplication())
        .getRetenoInstance()
        .setAnonymousUserAttributes(anonymousUser);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK Error", e);
      return;
    }


    WritableMap res = new WritableNativeMap();
    res.putBoolean("success", true);

    promise.resolve(res);
  }

  @ReactMethod
  public void forcePushData(Promise promise) {
    try {
      ((RetenoApplication) this.context.getCurrentActivity().getApplication())
        .getRetenoInstance().forcePushData();
        promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK forcePushData Error", e);
    }
  }

  @ReactMethod
  public void pauseInAppMessages(Boolean isPaused, Promise promise) {
    try {
      ((RetenoApplication) this.context.getCurrentActivity().getApplication())
        .getRetenoInstance()
        .pauseInAppMessages(isPaused);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK pauseInAppMessages Error", e);
    }
  }

  @ReactMethod
  public void updatePushPermissionStatusAndroid(Promise promise) {
    try {
      ((RetenoApplication) this.context.getCurrentActivity().getApplication())
        .getRetenoInstance().updatePushPermissionStatus();
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK forcePushData Error", e);
    }
  }

  private void sendEventToJS(String eventName, WritableMap eventData) {
    ReactContext reactContext = ((RetenoReactNativeApplication) this.context.getApplicationContext())
      .getReactContext();
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, eventData);
  }

  private InAppLifecycleCallback inAppLifecycleCallback;

  @ReactMethod
  public void setInAppLifecycleCallback(Promise promise) {
    try {
      inAppLifecycleCallback = new InAppLifecycleCallback() {
        @Override
        public void beforeDisplay(@NonNull InAppData inAppData) {
          WritableMap eventData = Arguments.createMap();
          eventData.putString("source", inAppData.getSource().toString());
          eventData.putString("id", inAppData.getId());
          sendEventToJS("reteno-before-in-app-display", eventData);
        }

        @Override
        public void onDisplay(@NonNull InAppData inAppData) {
          WritableMap eventData = Arguments.createMap();
          eventData.putString("source", inAppData.getSource().toString());
          eventData.putString("id", inAppData.getId());
          sendEventToJS("reteno-on-in-app-display", eventData);
        }

        @Override
        public void beforeClose(@NonNull InAppCloseData closeData) {
          WritableMap eventData = Arguments.createMap();
          eventData.putString("source", closeData.getSource().toString());
          eventData.putString("id", closeData.getId());
          eventData.putString("closeAction", closeData.getCloseAction().toString());
          sendEventToJS("reteno-before-in-app-close", eventData);
        }

        @Override
        public void afterClose(@NonNull InAppCloseData closeData) {
          WritableMap eventData = Arguments.createMap();
          eventData.putString("source", closeData.getSource().toString());
          eventData.putString("id", closeData.getId());
          eventData.putString("closeAction", closeData.getCloseAction().toString());
          sendEventToJS("reteno-after-in-app-close", eventData);
        }

        @Override
        public void onError(@NonNull InAppErrorData errorData) {
          WritableMap eventData = Arguments.createMap();
          eventData.putString("source", errorData.getSource().toString());
          eventData.putString("id", errorData.getId());
          eventData.putString("errorMessage", errorData.getErrorMessage());
          sendEventToJS("reteno-on-in-app-error", eventData);
        }
      };
      ((RetenoApplication) this.context.getCurrentActivity().getApplication())
        .getRetenoInstance().setInAppLifecycleCallback(inAppLifecycleCallback);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK setInAppLifecycleCallback Error", e);
    }
  }

  @ReactMethod
  public void removeInAppLifecycleCallback(Promise promise) {
    try {
      if (inAppLifecycleCallback != null) {
        ((RetenoApplication) this.context.getCurrentActivity().getApplication()).getRetenoInstance().setInAppLifecycleCallback(null);
        inAppLifecycleCallback = null;
      }
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK removeInAppLifecycleCallback Error", e);
      }
  }

  private List<String> convertReadableArrayToStringList(ReadableArray array) {
    List<String> list = new ArrayList<>();
    for (int i = 0; i < array.size(); i++) {
      list.add(array.getString(i));
    }
    return list;
  }

  @ReactMethod
  public void getRecommendations(ReadableMap payload, Promise promise) {
    if (payload == null) {
      promise.reject("PayloadError", "Payload cannot be null");
      return;
    }

    String recomVariantId = payload.hasKey("recomVariantId") ? payload.getString("recomVariantId") : null;
    ReadableArray productIdsArray = payload.getArray("productIds");
    ReadableArray fieldsArray = payload.getArray("fields");
    String categoryId = payload.hasKey("categoryId") ? payload.getString("categoryId") : null;

    if (recomVariantId == null || productIdsArray == null || fieldsArray == null) {
      promise.reject("PayloadError", "Required fields are missing in the payload");
      return;
    }

    List<String> productIds = convertReadableArrayToStringList(productIdsArray);
    List<String> fields = convertReadableArrayToStringList(fieldsArray);

    RecomRequest request = new RecomRequest(productIds, categoryId, fields, null);

    ((RetenoApplication) this.context.getCurrentActivity().getApplication())
      .getRetenoInstance().getRecommendation().fetchRecommendation(recomVariantId, request, RetenoRecommendationsResponse.class, new GetRecommendationResponseCallback<RetenoRecommendationsResponse>() {
        @Override
        public void onSuccess(@NonNull Recoms<RetenoRecommendationsResponse> response) {
          List<WritableMap> recoms = new ArrayList<>();

          for (RetenoRecommendationsResponse recom : response.getRecoms()) {
            WritableMap recomMap = Arguments.createMap();
            recomMap.putString("productId", recom.getProductId());
            recomMap.putString("description", recom.getDescr());
            recoms.add(recomMap);
          }

          WritableArray recomsArray = Arguments.createArray();
          for (WritableMap map : recoms) {
            recomsArray.pushMap(map);
          }
          promise.resolve(recomsArray);
        }

        @Override
        public void onSuccessFallbackToJson(@NonNull String response) {
          promise.resolve(response);
        }

        @Override
        public void onFailure(Integer statusCode, String response, Throwable throwable) {
          promise.reject(String.valueOf(statusCode), response, throwable);
        }
      });
  }

  @ReactMethod
  public void logRecommendationEvent(ReadableMap payload, Promise promise) {
    if (payload == null) {
      promise.reject("PayloadError", "Payload cannot be null");
      return;
    }

    String recomVariantId = payload.hasKey("recomVariantId") ? payload.getString("recomVariantId") : null;
    ReadableArray impressionsArray = payload.hasKey("impressions") ? payload.getArray("impressions") : null;
    ReadableArray clicksArray = payload.hasKey("clicks") ? payload.getArray("clicks") : null;

    if (recomVariantId == null || impressionsArray == null || clicksArray == null) {
      promise.reject("PayloadError", "Required fields are missing in the payload");
      return;
    }

    try {
      List<RecomEvent> events = new ArrayList<>();

      for (int i = 0; i < impressionsArray.size(); i++) {
        ReadableMap eventMap = impressionsArray.getMap(i);
          String productId = eventMap.hasKey("productId") ? eventMap.getString("productId") : null;
          if (productId != null) {
            events.add(new RecomEvent(RecomEventType.IMPRESSIONS, ZonedDateTime.now(), productId));
          }
      }

      for (int i = 0; i < clicksArray.size(); i++) {
        ReadableMap eventMap = clicksArray.getMap(i);
          String productId = eventMap.hasKey("productId") ? eventMap.getString("productId") : null;
          if (productId != null) {
            events.add(new RecomEvent(RecomEventType.CLICKS, ZonedDateTime.now(), productId));
          }
      }

      RecomEvents recomEvents = new RecomEvents(recomVariantId, events);

      ((RetenoApplication) this.context.getCurrentActivity().getApplication())
        .getRetenoInstance().getRecommendation().logRecommendations(recomEvents);

      promise.resolve(true);
    } catch (IllegalArgumentException e) {
      promise.reject("InvalidEventType", "Invalid recommendation event type");
    } catch (Exception e) {
      promise.reject("Reteno Android SDK logRecommendationEvent Error", e);
    }
  }
}
