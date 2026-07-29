package com.retenosdk;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.reteno.push.events.NotificationReceived;

public class RetenoPushReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    RetenoSdkModule.onRetenoPushReceived(context, intent);
    // This receiver replaces the native SDK's own PushReceivedReceiver (via the
    // com.reteno.Receiver.PushReceived meta-data override), so RetenoNotifications.received
    // would otherwise never fire in a React Native app. Re-dispatch it manually.
    Bundle extras = intent.getExtras();
    NotificationReceived.INSTANCE.notifyListeners(extras != null ? extras : new Bundle());
  }
}
