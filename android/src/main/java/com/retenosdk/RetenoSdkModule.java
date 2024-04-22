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
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.reteno.core.RetenoApplication;
import com.reteno.core.domain.model.user.User;
import com.reteno.core.domain.model.user.UserAttributesAnonymous;
import com.reteno.core.view.iam.callback.InAppData;
import com.reteno.core.view.iam.callback.InAppCloseData;
import com.reteno.core.view.iam.callback.InAppErrorData;
import com.reteno.core.view.iam.callback.InAppLifecycleCallback;

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
    WritableMap params;
    Bundle extras = intent.getExtras();
    if (extras != null) {
      try {
        params = Arguments.fromBundle(extras);
      } catch (Exception e) {
        params = Arguments.createMap();
      }
    } else {
      params = Arguments.createMap();
    }

    ReactContext reactContext = ((RetenoReactNativeApplication) context.getApplicationContext())
      .getReactContext();

    if (reactContext != null) {
      reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("reteno-push-received", params);
    }
  }

  public static void onRetenoPushClicked(Context context, Intent intent) {
    WritableMap params;
    Bundle extras = intent.getExtras();
    if (extras != null) {
      try {
        params = Arguments.fromBundle(extras);
      } catch (Exception e) {
        params = Arguments.createMap();
      }
    } else {
      params = Arguments.createMap();
    }
  }

  private WritableMap parseIntent(Intent intent){
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
}
