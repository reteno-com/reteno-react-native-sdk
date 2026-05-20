package com.retenosdk;

import android.app.Activity;
import androidx.annotation.Nullable;
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
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.reteno.core.Reteno;
import com.reteno.core.RetenoConfig;
import com.reteno.core.data.remote.model.recommendation.get.Recoms;
import com.reteno.core.domain.callback.appinbox.RetenoResultCallback;
import com.reteno.core.domain.model.appinbox.AppInboxMessages;
import com.reteno.core.domain.model.appinbox.AppInboxMessage;
import com.reteno.core.domain.model.user.User;
import com.reteno.core.domain.model.user.UserAttributesAnonymous;
import com.reteno.core.domain.model.recommendation.get.RecomRequest;
import com.reteno.core.domain.model.recommendation.post.RecomEvent;
import com.reteno.core.domain.model.recommendation.post.RecomEventType;
import com.reteno.core.domain.model.recommendation.post.RecomEvents;
import com.reteno.core.domain.model.event.LifecycleTrackingOptions;
import com.reteno.core.features.appinbox.AppInboxStatus;
import com.reteno.core.view.iam.callback.InAppData;
import com.reteno.core.view.iam.callback.InAppCloseData;
import com.reteno.core.view.iam.callback.InAppErrorData;
import com.reteno.core.view.iam.callback.InAppLifecycleCallback;
import com.reteno.core.features.recommendation.GetRecommendationResponseCallback;
import com.reteno.core.domain.model.ecom.EcomEvent;
import com.reteno.core.features.iam.InAppPauseBehaviour;
import com.reteno.push.RetenoNotifications;
import com.reteno.push.permission.NotificationStatus;
import com.reteno.push.events.InAppCustomData;
import com.reteno.core.util.Procedure;

import kotlin.Unit;

import android.util.Log;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class RetenoSdkModule extends ReactContextBaseJavaModule {
  public static final String NAME = "RetenoSdk";
  private static final String PREFS_NAME = "RetenoPrefs";
  private static final String AUTO_OPEN_LINKS_KEY = "autoOpenLinks";
  private static volatile boolean sdkInitialized = false;
  private static volatile ReactApplicationContext sharedReactContext;
  ReactApplicationContext context;

  public static boolean isAutoOpenLinksEnabled(Context context) {
    SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    return prefs.getBoolean(AUTO_OPEN_LINKS_KEY, true); // default true
  }

  public static ReactApplicationContext getSharedReactContext() {
    return sharedReactContext;
  }

  public RetenoSdkModule(ReactApplicationContext reactContext) {
    super(reactContext);
    context = reactContext;
    sharedReactContext = reactContext;
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @Override
  public void onCatalystInstanceDestroy() {
    cleanupRetenoNotificationsListeners();
    super.onCatalystInstanceDestroy();
  }

  @Override
  public void invalidate() {
    cleanupRetenoNotificationsListeners();
    super.invalidate();
  }

  @ReactMethod
  public void setDeviceToken(String deviceToken, Promise promise) {
  }

  @ReactMethod
  public synchronized void initialize(ReadableMap payload, Promise promise) {
    if (sdkInitialized) {
      promise.resolve(true);
      return;
    }

    String apiKey = (payload != null && payload.hasKey("apiKey") && !payload.isNull("apiKey"))
      ? payload.getString("apiKey")
      : null;

    if (apiKey == null || apiKey.trim().isEmpty()) {
      promise.reject("100", "Missing argument: apiKey");
      return;
    }

    try {
      boolean debugMode = payload != null && payload.hasKey("isDebugMode")
        && !payload.isNull("isDebugMode") && payload.getBoolean("isDebugMode");
      boolean pauseInAppMessages = payload != null && payload.hasKey("pauseInAppMessages")
        && !payload.isNull("pauseInAppMessages") && payload.getBoolean("pauseInAppMessages");

      RetenoConfig.Builder builder = new RetenoConfig.Builder()
        .accessKey(apiKey.trim())
        .setDebug(debugMode);

      if (pauseInAppMessages) {
        builder.pauseInAppMessages(true);
      }

      com.facebook.react.bridge.Dynamic lifecycleDynamic = null;
      if (payload != null && payload.hasKey("lifecycleTrackingOptions")) {
        lifecycleDynamic = payload.getDynamic("lifecycleTrackingOptions");
      }
      LifecycleTrackingOptions lifecycleOptions = parseLifecycleTrackingOption(lifecycleDynamic);
      if (payload != null && payload.hasKey("lifecycleTrackingOptions") && lifecycleOptions == null) {
        promise.reject(
          "InvalidArgument",
          "Invalid argument: lifecycleTrackingOptions. Expected 'ALL', 'NONE', or lifecycle options object."
        );
        return;
      }
      if (lifecycleOptions != null) {
        builder.lifecycleTrackingOptions(lifecycleOptions);
      }

      if (payload != null && payload.hasKey("sessionDurationSeconds") && !payload.isNull("sessionDurationSeconds")) {
        double sessionDurationSeconds = payload.getDouble("sessionDurationSeconds");
        if (sessionDurationSeconds > 0D) {
          builder.sessionDuration((long) (sessionDurationSeconds * 1000L));
        }
      }

      Reteno.initWithConfig(builder.build());
      sdkInitialized = true;
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK initialize Error", e);
    }
  }

  private LifecycleTrackingOptions parseLifecycleTrackingOption(@Nullable com.facebook.react.bridge.Dynamic value) {
    if (value == null || value.isNull()) {
      return null;
    }

    ReadableType type = value.getType();
    if (type == ReadableType.String) {
      String raw = value.asString();
      if (raw == null) {
        return null;
      }
      String normalized = raw.trim().toUpperCase();
      if ("ALL".equals(normalized)) {
        return new LifecycleTrackingOptions(true, true, true, true, true);
      }
      if ("NONE".equals(normalized)) {
        return new LifecycleTrackingOptions(false, false, false, false, false);
      }
      return null;
    }

    if (type != ReadableType.Map) {
      return null;
    }

    ReadableMap map = value.asMap();

    boolean appLifecycleEnabled = map.hasKey("appLifecycleEnabled")
      ? map.getBoolean("appLifecycleEnabled")
      : true;
    boolean foregroundLifecycleEnabled = map.hasKey("foregroundLifecycleEnabled")
      ? map.getBoolean("foregroundLifecycleEnabled")
      : false;
    boolean pushSubscriptionEnabled = map.hasKey("pushSubscriptionEnabled")
      ? map.getBoolean("pushSubscriptionEnabled")
      : true;

    boolean legacySessionEventsEnabled = map.hasKey("sessionEventsEnabled")
      ? map.getBoolean("sessionEventsEnabled")
      : true;
    boolean sessionStartEventsEnabled = map.hasKey("sessionStartEventsEnabled")
      ? map.getBoolean("sessionStartEventsEnabled")
      : legacySessionEventsEnabled;

    boolean sessionEndEventsEnabled;
    if (map.hasKey("sessionEndEventsEnabled")) {
      sessionEndEventsEnabled = map.getBoolean("sessionEndEventsEnabled");
    } else if (map.hasKey("sessionEventsEnabled")) {
      sessionEndEventsEnabled = legacySessionEventsEnabled;
    } else {
      sessionEndEventsEnabled = false;
    }

    return new LifecycleTrackingOptions(
      appLifecycleEnabled,
      foregroundLifecycleEnabled,
      pushSubscriptionEnabled,
      sessionStartEventsEnabled,
      sessionEndEventsEnabled
    );
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
      getRetenoInstance()
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
    RetenoEventQueue.getInstance().dispatch(
      "reteno-push-received",
      parseIntent(intent),
      sharedReactContext
    );
  }

  public static void onRetenoPushClicked(Context context, Intent intent) {
    RetenoEventQueue.getInstance().dispatch(
      "reteno-push-clicked",
      parseIntent(intent),
      sharedReactContext
    );
  }

  private static WritableMap parseBundle(Bundle bundle) {
    WritableMap params = Arguments.createMap();
    if (bundle != null) {
      try {
        for (String key : bundle.keySet()) {
          Object value = bundle.get(key);
          if (value instanceof HashMap) {
            @SuppressWarnings("unchecked")
            WritableMap map = convertHashMap((HashMap<String, Object>) value);
            params.putMap(key, map);
          } else {
            params.putString(key, value != null ? value.toString() : null);
          }
        }
      } catch (Exception e) {
        Log.e("parseBundle", "Error converting Bundle to WritableMap: " + e.getMessage(), e);
      }
    }
    return params;
  }

  private static WritableMap parseIntent(Intent intent) {
    return parseBundle(intent.getExtras());
  }

  private static WritableMap convertHashMap(HashMap<String, Object> map) {
    WritableMap writableMap = Arguments.createMap();

    for (Map.Entry<String, Object> entry : map.entrySet()) {
      String key = entry.getKey();
      Object value = entry.getValue();

      if (value instanceof String) {
        writableMap.putString(key, (String) value);
      } else if (value instanceof Integer) {
        writableMap.putInt(key, (Integer) value);
      } else if (value instanceof Double) {
        writableMap.putDouble(key, (Double) value);
      } else if (value instanceof Boolean) {
        writableMap.putBoolean(key, (Boolean) value);
      } else if (value instanceof HashMap) {
        @SuppressWarnings("unchecked")
        WritableMap nestedMap = convertHashMap((HashMap<String, Object>) value);
        writableMap.putMap(key, nestedMap);
      } else {
        writableMap.putString(key, value != null ? value.toString() : null);
      }
    }

    return writableMap;
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
      getRetenoInstance()
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
      getRetenoInstance()
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
      getRetenoInstance().forcePushData();
        promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK forcePushData Error", e);
    }
  }

  @ReactMethod
  public void pauseInAppMessages(Boolean isPaused, Promise promise) {
    try {
      getRetenoInstance()
        .pauseInAppMessages(isPaused);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK pauseInAppMessages Error", e);
    }
  }

  @ReactMethod
  public void setInAppMessagesPauseBehaviour(String behaviour, Promise promise) {
    if (behaviour == null || behaviour.trim().isEmpty()) {
      promise.reject("InvalidArgument", "Missing argument: behaviour ('SKIP_IN_APPS' or 'POSTPONE_IN_APPS')");
      return;
    }

    String normalized = behaviour.trim().toUpperCase();
    InAppPauseBehaviour parsedBehaviour;

    if ("SKIP_IN_APPS".equals(normalized)) {
      parsedBehaviour = InAppPauseBehaviour.SKIP_IN_APPS;
    } else if ("POSTPONE_IN_APPS".equals(normalized)) {
      parsedBehaviour = InAppPauseBehaviour.POSTPONE_IN_APPS;
    } else {
      promise.reject("InvalidArgument", "Invalid argument: behaviour must be 'SKIP_IN_APPS' or 'POSTPONE_IN_APPS'");
      return;
    }

    try {
      Activity currentActivity = getCurrentActivity();
      if (currentActivity == null) {
        promise.reject("ActivityUnavailable", "Current activity is not available");
        return;
      }
      getRetenoInstance()
        .setInAppMessagesPauseBehaviour(parsedBehaviour);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK setInAppMessagesPauseBehaviour Error", e);
    }
  }

  @ReactMethod
  public void setMultiAccountUserAttributes(ReadableMap payload, Promise promise) {
    String externalUserId = (payload.hasKey("externalUserId") && !payload.isNull("externalUserId"))
      ? payload.getString("externalUserId")
      : null;
    if (externalUserId == null || externalUserId.isEmpty()) {
      promise.reject("Parsing error", "externalUserId cannot be null");
      return;
    }

    User user = RetenoUserAttributes.buildUserFromPayload(payload);

    try {
      Activity currentActivity = getCurrentActivity();
      if (currentActivity == null) {
        promise.reject("ActivityUnavailable", "Current activity is not available");
        return;
      }
      getRetenoInstance()
        .setMultiAccountUserAttributes(externalUserId, user);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK Error", e);
      return;
    }

    WritableMap res = new WritableNativeMap();
    res.putBoolean("success", true);
    promise.resolve(res);
  }

  @ReactMethod
  public void updatePushPermissionStatusAndroid(Promise promise) {
    try {
      getRetenoInstance().updatePushPermissionStatus();
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK forcePushData Error", e);
    }
  }

  private void sendEventToJS(String eventName, WritableMap eventData) {
    RetenoEventQueue.getInstance().dispatch(eventName, eventData, sharedReactContext);
  }

  private Procedure<Bundle> pushDismissedListener;
  private Procedure<Bundle> customPushListener;
  private Procedure<InAppCustomData> inAppCustomDataRetenoListener;
  private boolean notificationsListenersSetup = false;

  private void setupRetenoNotificationsListeners() {
    if (notificationsListenersSetup) {
      return;
    }
    notificationsListenersSetup = true;
    try {
      pushDismissedListener = bundle -> {
        sendEventToJS("reteno-push-dismissed", parseBundle(bundle));
      };
      RetenoNotifications.INSTANCE.getClose().addListener(pushDismissedListener);
    } catch (Exception e) {
      Log.w(NAME, "Could not register push dismissed listener", e);
    }

    try {
      customPushListener = bundle -> {
        sendEventToJS("reteno-custom-push-received", parseBundle(bundle));
      };
      RetenoNotifications.INSTANCE.getCustom().addListener(customPushListener);
    } catch (Exception e) {
      Log.w(NAME, "Could not register custom push listener", e);
    }

    try {
      inAppCustomDataRetenoListener = inAppCustomData -> {
        WritableMap eventData = Arguments.createMap();
        eventData.putString("url", inAppCustomData.getUrl());
        eventData.putString("inapp_source", inAppCustomData.getSource());
        eventData.putString("inapp_id", inAppCustomData.getInAppId());
        WritableMap customDataMap = Arguments.createMap();
        if (inAppCustomData.getData() != null) {
          for (Map.Entry<String, String> entry : inAppCustomData.getData().entrySet()) {
            customDataMap.putString(entry.getKey(), entry.getValue());
          }
        }
        eventData.putMap("customData", customDataMap);
        sendEventToJS("reteno-in-app-custom-data-received", eventData);
      };
      RetenoNotifications.INSTANCE.getInAppCustomDataReceived().addListener(inAppCustomDataRetenoListener);
    } catch (Exception e) {
      Log.w(NAME, "Could not register in-app custom data listener", e);
    }
  }

  private void cleanupRetenoNotificationsListeners() {
    if (!notificationsListenersSetup) {
      return;
    }
    notificationsListenersSetup = false;

    try {
      if (pushDismissedListener != null) {
        RetenoNotifications.INSTANCE.getClose().removeListener(pushDismissedListener);
        pushDismissedListener = null;
      }
    } catch (Exception e) {
      Log.w(NAME, "Could not unregister push dismissed listener", e);
    }

    try {
      if (customPushListener != null) {
        RetenoNotifications.INSTANCE.getCustom().removeListener(customPushListener);
        customPushListener = null;
      }
    } catch (Exception e) {
      Log.w(NAME, "Could not unregister custom push listener", e);
    }

    try {
      if (inAppCustomDataRetenoListener != null) {
        RetenoNotifications.INSTANCE.getInAppCustomDataReceived().removeListener(inAppCustomDataRetenoListener);
        inAppCustomDataRetenoListener = null;
      }
    } catch (Exception e) {
      Log.w(NAME, "Could not unregister in-app custom data listener", e);
    }
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
      getRetenoInstance().setInAppLifecycleCallback(inAppLifecycleCallback);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK setInAppLifecycleCallback Error", e);
    }
  }

  @ReactMethod
  public void removeInAppLifecycleCallback(Promise promise) {
    try {
      if (inAppLifecycleCallback != null) {
        getRetenoInstance().setInAppLifecycleCallback(null);
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

    getRetenoInstance().getRecommendation().fetchRecommendation(recomVariantId, request, RetenoRecommendationsResponse.class, new GetRecommendationResponseCallback<RetenoRecommendationsResponse>() {
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

      getRetenoInstance().getRecommendation().logRecommendations(recomEvents);

      promise.resolve(true);
    } catch (IllegalArgumentException e) {
      promise.reject("InvalidEventType", "Invalid recommendation event type");
    } catch (Exception e) {
      promise.reject("Reteno Android SDK logRecommendationEvent Error", e);
    }
  }

  @ReactMethod
  public void getAppInboxMessages(ReadableMap payload, Promise promise) {
    Integer page = null;
    Integer pageSize = null;
    AppInboxStatus status = null;

    if (payload.hasKey("page") && !payload.isNull("page")) {
      page = payload.getInt("page");
    }

    if (payload.hasKey("pageSize") && !payload.isNull("pageSize")) {
      pageSize = payload.getInt("pageSize");
    }

    if (payload.hasKey("status") && !payload.isNull("status")) {
      String statusString = payload.getString("status");
      if ("OPENED".equalsIgnoreCase(statusString)) {
        status = AppInboxStatus.OPENED;
      } else if ("UNOPENED".equalsIgnoreCase(statusString)) {
        status = AppInboxStatus.UNOPENED;
      }
    }

    try {
      getRetenoInstance()
        .getAppInbox()
        .getAppInboxMessages(page, pageSize, status, new RetenoResultCallback<AppInboxMessages>() {
          @Override
          public void onSuccess(AppInboxMessages result) {
            WritableArray messagesArray = Arguments.createArray();
            for (AppInboxMessage message : result.getMessages()) {
              WritableMap messageMap = Arguments.createMap();
              messageMap.putString("id", message.getId());
              messageMap.putString("title", message.getTitle());
              messageMap.putString("createdDate", message.getCreatedDate());
              messageMap.putBoolean("isNew", message.isNewMessage());
              messageMap.putString("content", message.getContent());
              messageMap.putString("imageURL", message.getImageUrl());
              messageMap.putString("linkURL", message.getLinkUrl());
              messageMap.putString("category", message.getCategory());
              messageMap.putString("status", message.getStatus() != null ? message.getStatus().name() : null);
              messagesArray.pushMap(messageMap);
            }
            WritableMap resultData = Arguments.createMap();
            resultData.putArray("messages", messagesArray);
            resultData.putInt("totalPages", result.getTotalPages());
            promise.resolve(resultData);
          }

          @Override
          public void onFailure(@Nullable Integer statusCode, @Nullable String response, @Nullable Throwable throwable) {
            promise.reject("Reteno Android SDK getAppInboxMessages Error", response, throwable);
          }
        });
    } catch (Exception e) {
      promise.reject("Reteno Android SDK getAppInboxMessages Error", e);
    }
  }

  @ReactMethod
  public void getAppInboxMessagesCount(Promise promise) {
    try {
      getRetenoInstance()
        .getAppInbox()
        .getAppInboxMessagesCount(new RetenoResultCallback<Integer>() {
          @Override
          public void onSuccess(Integer count) {
            promise.resolve(count);
          }

          @Override
          public void onFailure(@Nullable Integer statusCode, @Nullable String response, @Nullable Throwable throwable) {
            promise.reject("Reteno Android SDK getAppInboxMessagesCount Error", response, throwable);
          }
        });
    } catch (Exception e) {
      promise.reject("Reteno Android SDK getAppInboxMessagesCount Error", e);
    }
  }

  @ReactMethod
  public void markAsOpened(String messageId, Promise promise) {
    try {
      getRetenoInstance()
        .getAppInbox()
        .markAsOpened(messageId);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK markAsOpened Error", e);
    }
  }

  @ReactMethod
  public void markAllAsOpened(Promise promise) {
    try {
      getRetenoInstance()
        .getAppInbox()
        .markAllMessagesAsOpened(new RetenoResultCallback<Unit>() {
          @Override
          public void onSuccess(Unit result) {
            promise.resolve(true);
          }

          @Override
          public void onFailure(@Nullable Integer statusCode, @Nullable String response, @Nullable Throwable throwable) {
            promise.reject("Reteno Android SDK markAllAsOpened Error", response, throwable);
          }
        });
    } catch (Exception e) {
      promise.reject("Reteno Android SDK markAllAsOpened Error", e);
    }
  }

  @ReactMethod
  public void unsubscribeAllMessagesCountChanged(Promise promise) {
    try {
      getRetenoInstance().getAppInbox().unsubscribeAllMessagesCountChanged();
      messagesCountChangedCallback = null;
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("UnsubscribeError", e);
    }
  }

  private RetenoResultCallback<Integer> messagesCountChangedCallback;

  @ReactMethod
  public void onUnreadMessagesCountChanged(Promise promise) {
    messagesCountChangedCallback = new RetenoResultCallback<Integer>() {
      @Override
      public void onSuccess(Integer count) {
        WritableMap eventData = Arguments.createMap();
        eventData.putInt("count", count);
        sendEventToJS("reteno-unread-messages-count", eventData);
      }

      @Override
      public void onFailure(@Nullable Integer statusCode, @Nullable String response, @Nullable Throwable throwable) {
        WritableMap eventData = Arguments.createMap();
        eventData.putInt("statusCode", statusCode != null ? statusCode : -1);
        eventData.putString("response", response);
        eventData.putString("error", throwable != null ? throwable.getMessage() : null);
        sendEventToJS("reteno-unread-messages-count-error", eventData);
      }
    };

    try {
      getRetenoInstance().getAppInbox().subscribeOnMessagesCountChanged(messagesCountChangedCallback);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("SubscriptionError", e);
    }
  }

  @ReactMethod
  public void unsubscribeMessagesCountChanged(Promise promise) {
    try {
      if (messagesCountChangedCallback != null) {
        getRetenoInstance().getAppInbox().unsubscribeMessagesCountChanged(messagesCountChangedCallback);
        messagesCountChangedCallback = null;
      } else {
        getRetenoInstance().getAppInbox().unsubscribeAllMessagesCountChanged();
      }
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("UnsubscribeError", e);
    }
  }

  @ReactMethod
  public void initializeEventHandler(Promise promise) {
    try {
      RetenoEventQueue.getInstance().setInitialized(sharedReactContext);
      setupRetenoNotificationsListeners();
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK initializeEventHandler Error", e);
    }
  }

  private Reteno getRetenoInstance() {
    Reteno reteno = Reteno.getInstance();
    if (reteno == null) {
      throw new IllegalStateException(
        "Reteno SDK is not initialized. Call initialize(apiKey) before using SDK methods."
      );
    }
    return reteno;
  }

  @ReactMethod
  public void setAutoOpenLinks(boolean enabled, Promise promise) {
    SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    prefs.edit().putBoolean(AUTO_OPEN_LINKS_KEY, enabled).apply();
    promise.resolve(true);
  }

  @ReactMethod
  public void getAutoOpenLinks(Promise promise) {
    promise.resolve(isAutoOpenLinksEnabled(context));
  }

  /**
   * Ecommerce Events
 * 1. Product Viewed Event
 */
@ReactMethod
public void logEcomEventProductViewed(ReadableMap payload, Promise promise) {
  try {
    EcomEvent.ProductViewed event = RetenoEcomEvent.buildProductViewedFromPayload(payload);
    if (event == null) {
      promise.reject("Payload Error", "Payload cannot be null");
      return;
    }
    getRetenoInstance()
      .logEcommerceEvent(event);
  } catch (Exception e) {
    promise.reject("Reteno Android SDK Error", e);
    return;
  }
  WritableMap res = new WritableNativeMap();
  res.putBoolean("success", true);
  promise.resolve(res);
}

@ReactMethod
public void logEcomEventProductCategoryViewed(ReadableMap payload, Promise promise) {
  try {
    EcomEvent.ProductCategoryViewed event = RetenoEcomEvent.buildProductCategoryViewedFromPayload(payload);
    if (event == null) {
      promise.reject("Payload Error", "Payload cannot be null");
      return;
    }
    getRetenoInstance()
      .logEcommerceEvent(event);
  } catch (Exception e) {
    promise.reject("Reteno Android SDK Error", e);
    return;
  }
  WritableMap res = new WritableNativeMap();
  res.putBoolean("success", true);
  promise.resolve(res);
}

@ReactMethod
public void logEcomEventProductAddedToWishlist(ReadableMap payload, Promise promise) {
  try {
    EcomEvent.ProductAddedToWishlist event = RetenoEcomEvent.buildProductAddedToWishlistFromPayload(payload);
    if (event == null) {
      promise.reject("Payload Error", "Payload cannot be null");
      return;
    }
    getRetenoInstance()
      .logEcommerceEvent(event);
  } catch (Exception e) {
    promise.reject("Reteno Android SDK Error", e);
    return;
  }
  WritableMap res = new WritableNativeMap();
  res.putBoolean("success", true);
  promise.resolve(res);
}

@ReactMethod
public void logEcomEventCartUpdated(ReadableMap payload, Promise promise) {
  try {
    EcomEvent.CartUpdated event = RetenoEcomEvent.buildCartUpdatedFromPayload(payload);
    if (event == null) {
      promise.reject("Payload Error", "Payload cannot be null");
      return;
    }
    getRetenoInstance()
      .logEcommerceEvent(event);
  } catch (Exception e) {
    promise.reject("Reteno Android SDK Error", e);
    return;
  }
  WritableMap res = new WritableNativeMap();
  res.putBoolean("success", true);
  promise.resolve(res);
}

@ReactMethod
public void logEcomEventOrderCreated(ReadableMap payload, Promise promise) {
  try {
    EcomEvent.OrderCreated event = RetenoEcomEvent.buildOrderCreatedFromPayload(payload);
    if (event == null) {
      promise.reject("Payload Error", "Payload cannot be null");
      return;
    }
    getRetenoInstance()
      .logEcommerceEvent(event);
  } catch (Exception e) {
    promise.reject("Reteno Android SDK Error", e);
    return;
  }
  WritableMap res = new WritableNativeMap();
  res.putBoolean("success", true);
  promise.resolve(res);
}

@ReactMethod
public void logEcomEventOrderUpdated(ReadableMap payload, Promise promise) {
  try {
    EcomEvent.OrderUpdated event = RetenoEcomEvent.buildOrderUpdatedFromPayload(payload);
    if (event == null) {
      promise.reject("Payload Error", "Payload cannot be null");
      return;
    }
    getRetenoInstance()
      .logEcommerceEvent(event);
  } catch (Exception e) {
    promise.reject("Reteno Android SDK Error", e);
    return;
  }
  WritableMap res = new WritableNativeMap();
  res.putBoolean("success", true);
  promise.resolve(res);
}

@ReactMethod
public void logEcomEventOrderDelivered(ReadableMap payload, Promise promise) {
  try {
    EcomEvent.OrderDelivered event = RetenoEcomEvent.buildOrderDeliveredFromPayload(payload);
    if (event == null) {
      promise.reject("Payload Error", "Payload cannot be null");
      return;
    }
    getRetenoInstance()
      .logEcommerceEvent(event);
  } catch (Exception e) {
    promise.reject("Reteno Android SDK Error", e);
    return;
  }
  WritableMap res = new WritableNativeMap();
  res.putBoolean("success", true);
  promise.resolve(res);
}

@ReactMethod
public void logEcomEventOrderCancelled(ReadableMap payload, Promise promise) {
  try {
    EcomEvent.OrderCancelled event = RetenoEcomEvent.buildOrderCancelledFromPayload(payload);
    if (event == null) {
      promise.reject("Payload Error", "Payload cannot be null");
      return;
    }
    getRetenoInstance()
      .logEcommerceEvent(event);
  } catch (Exception e) {
    promise.reject("Reteno Android SDK Error", e);
    return;
  }
  WritableMap res = new WritableNativeMap();
  res.putBoolean("success", true);
  promise.resolve(res);
}

@ReactMethod
public void logEcomEventSearchRequest(ReadableMap payload, Promise promise) {
  try {
    EcomEvent.SearchRequest event = RetenoEcomEvent.buildSearchRequestFromPayload(payload);
    if (event == null) {
      promise.reject("Payload Error", "Payload cannot be null");
      return;
    }
    getRetenoInstance()
      .logEcommerceEvent(event);
  } catch (Exception e) {
    promise.reject("Reteno Android SDK Error", e);
    return;
  }
  WritableMap res = new WritableNativeMap();
  res.putBoolean("success", true);
  promise.resolve(res);
}

  @ReactMethod
  public void requestNotificationPermission(Promise promise) {
    try {
      CompletableFuture<Boolean> future = RetenoNotifications.INSTANCE.requestNotificationPermissionFuture();
      future.thenAccept(granted -> promise.resolve(granted))
            .exceptionally(throwable -> {
              promise.reject("requestNotificationPermission Error", throwable.getMessage());
              return null;
            });
    } catch (Exception e) {
      promise.reject("Reteno Android SDK requestNotificationPermission Error", e);
    }
  }

  @ReactMethod
  public void getNotificationPermissionStatus(Promise promise) {
    try {
      CompletableFuture<NotificationStatus> future = RetenoNotifications.INSTANCE.getNotificationPermissionStatusFuture();
      future.thenAccept(status -> promise.resolve(status.name()))
            .exceptionally(throwable -> {
              promise.reject("getNotificationPermissionStatus Error", throwable.getMessage());
              return null;
            });
    } catch (Exception e) {
      promise.reject("Reteno Android SDK getNotificationPermissionStatus Error", e);
    }
  }

  @ReactMethod
  public void pausePushInAppMessages(Boolean isPaused, Promise promise) {
    try {
      Activity currentActivity = getCurrentActivity();
      if (currentActivity == null) {
        promise.reject("ActivityUnavailable", "Current activity is not available");
        return;
      }
      getRetenoInstance()
        .pausePushInAppMessages(isPaused);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK pausePushInAppMessages Error", e);
    }
  }

  @ReactMethod
  public void setPushInAppMessagesPauseBehaviour(String behaviour, Promise promise) {
    if (behaviour == null || behaviour.trim().isEmpty()) {
      promise.reject("InvalidArgument", "Missing argument: behaviour ('SKIP_IN_APPS' or 'POSTPONE_IN_APPS')");
      return;
    }

    String normalized = behaviour.trim().toUpperCase();
    InAppPauseBehaviour parsedBehaviour;

    if ("SKIP_IN_APPS".equals(normalized)) {
      parsedBehaviour = InAppPauseBehaviour.SKIP_IN_APPS;
    } else if ("POSTPONE_IN_APPS".equals(normalized)) {
      parsedBehaviour = InAppPauseBehaviour.POSTPONE_IN_APPS;
    } else {
      promise.reject("InvalidArgument", "Invalid argument: behaviour must be 'SKIP_IN_APPS' or 'POSTPONE_IN_APPS'");
      return;
    }

    try {
      Activity currentActivity = getCurrentActivity();
      if (currentActivity == null) {
        promise.reject("ActivityUnavailable", "Current activity is not available");
        return;
      }
      getRetenoInstance()
        .setPushInAppMessagesPauseBehaviour(parsedBehaviour);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject("Reteno Android SDK setPushInAppMessagesPauseBehaviour Error", e);
    }
  }
}
