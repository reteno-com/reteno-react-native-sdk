package com.retenosdk;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class RetenoClickReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    RetenoSdkModule.onRetenoPushClicked(context, intent);
  }
}
