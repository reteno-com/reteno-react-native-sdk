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
//    ((RetenoApplication) this.context.getCurrentActivity().getApplication()).getRetenoInstance();
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
}
