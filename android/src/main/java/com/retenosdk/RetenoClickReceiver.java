package com.retenosdk;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.reteno.push.events.NotificationClick;

public class RetenoClickReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    Bundle extras = intent.getExtras();
    // Registering this receiver in the manifest's NotificationClicked meta-data replaces
    // Reteno's own click receiver, which is what normally drives NotificationClick listeners
    // (e.g. RetenoNotificationSummaryManager). Notify it ourselves so those listeners still fire.
    NotificationClick.INSTANCE.notifyListeners(extras != null ? extras : Bundle.EMPTY);
    RetenoSdkModule.onRetenoPushClicked(context, intent);
  }
}
