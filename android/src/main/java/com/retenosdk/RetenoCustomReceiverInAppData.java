package com.retenosdk;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.net.Uri;
import android.webkit.URLUtil;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

public class RetenoCustomReceiverInAppData extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    Bundle extras = intent.getExtras();
    if (extras != null) {
      String url = extras.getString("url");

      dispatchCustomData(extras);

      if (url != null && URLUtil.isValidUrl(url) && RetenoSdkModule.isAutoOpenLinksEnabled(context)) {
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

  private void dispatchCustomData(Bundle extras) {
    WritableMap eventData = Arguments.createMap();
    WritableMap customDataMap = Arguments.createMap();

    for (String key : extras.keySet()) {
      Object value = extras.get(key);
      WritableMap target = isInAppMetadataKey(key) ? eventData : customDataMap;
      putValue(target, key, value);
    }

    eventData.putMap("customData", customDataMap);
    eventData.putString("source", "inAppMessage");

    // Keep this receiver as the single Android producer for the JS event. It can
    // enqueue the event before React Native calls initializeEventHandler().
    RetenoEventQueue.getInstance().dispatch(
      "reteno-in-app-custom-data-received",
      eventData,
      RetenoSdkModule.getSharedReactContext()
    );
  }

  private boolean isInAppMetadataKey(String key) {
    return "inapp_id".equals(key) || "inapp_source".equals(key) || "url".equals(key);
  }

  private void putValue(WritableMap target, String key, Object value) {
    if (value instanceof String) {
      target.putString(key, (String) value);
    } else if (value instanceof Integer) {
      target.putInt(key, (Integer) value);
    } else if (value instanceof Boolean) {
      target.putBoolean(key, (Boolean) value);
    } else if (value instanceof Double) {
      target.putDouble(key, (Double) value);
    }
  }
}
