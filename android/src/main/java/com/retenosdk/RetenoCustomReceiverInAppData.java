package com.retenosdk;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.net.Uri;
import android.webkit.URLUtil;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

public class RetenoCustomReceiverInAppData extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    Bundle extras = intent.getExtras();
    if (extras != null) {
      String url = extras.getString("url");

      handleCustomData(extras, context);

      if (url != null && URLUtil.isValidUrl(url)) {
        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        if (context instanceof Activity) {
          context.startActivity(browserIntent);
        } else {
          browserIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
          context.startActivity(browserIntent);
        }
      }
    }
  }

  private void handleCustomData(Bundle extras, Context context) {
    WritableMap eventData = Arguments.createMap();
    WritableMap customDataMap = Arguments.createMap();
    if (extras != null) {
      for (String key : extras.keySet()) {
        Object value = extras.get(key);
        if ("inapp_id".equals(key) || "inapp_source".equals(key) || "url".equals(key)) {
          if (value instanceof String) {
            eventData.putString(key, (String) value);
          } else if (value instanceof Integer) {
            eventData.putInt(key, (Integer) value);
          } else if (value instanceof Boolean) {
            eventData.putBoolean(key, (Boolean) value);
          } else if (value instanceof Double) {
            eventData.putDouble(key, (Double) value);
          }
        } else {
          if (value instanceof String) {
            customDataMap.putString(key, (String) value);
          } else if (value instanceof Integer) {
            customDataMap.putInt(key, (Integer) value);
          } else if (value instanceof Boolean) {
            customDataMap.putBoolean(key, (Boolean) value);
          } else if (value instanceof Double) {
            customDataMap.putDouble(key, (Double) value);
          }
        }
      }

      eventData.putMap("customData", customDataMap);
    }

    ReactContext reactContext = ((RetenoReactNativeApplication) context.getApplicationContext())
      .getReactContext();
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit("reteno-in-app-custom-data-received", eventData);
  }
}
