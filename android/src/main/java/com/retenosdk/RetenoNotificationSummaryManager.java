package com.retenosdk;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.service.notification.StatusBarNotification;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.reteno.core.util.Procedure;
import com.reteno.push.RetenoNotifications;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/** Maintains optional Android group-summary notifications for Reteno pushes. */
final class RetenoNotificationSummaryManager {
  private static final String SUMMARY_CHANNEL_ID = "reteno_group_summary";
  private static final String SUMMARY_TAG_PREFIX = "com.retenosdk.group-summary:";
  private static final int SUMMARY_NOTIFICATION_ID = 1;
  private static final int MAX_POST_ATTEMPTS = 25;
  private static final int MAX_REMOVAL_ATTEMPTS = 10;
  private static final long RETRY_DELAY_MS = 200L;

  private static RetenoNotificationSummaryManager instance;

  private final Context context;
  private final Handler mainHandler = new Handler(Looper.getMainLooper());
  private final Handler retryHandler = new Handler(Looper.getMainLooper());
  private final NotificationManagerCompat notificationManager;

  private Procedure<Bundle> receivedListener;
  private Procedure<Bundle> clickListener;
  private Procedure<Bundle> closeListener;
  private boolean enabled;
  private String ruleIdentity;

  private RetenoNotificationSummaryManager(Context context) {
    this.context = context.getApplicationContext();
    this.notificationManager = NotificationManagerCompat.from(this.context);
  }

  static synchronized void setEnabled(Context context, boolean enabled, String ruleIdentity) {
    if (instance == null) {
      instance = new RetenoNotificationSummaryManager(context);
    }
    instance.runOnMainThread(() -> instance.updateEnabled(enabled, ruleIdentity));
  }

  private void runOnMainThread(Runnable action) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      action.run();
    } else {
      mainHandler.post(action);
    }
  }

  private void updateEnabled(boolean shouldEnable, String ruleIdentity) {
    if (shouldEnable) {
      enable(ruleIdentity);
    } else {
      disable();
    }
  }

  private void enable(String ruleIdentity) {
    if (enabled) {
      if (Objects.equals(this.ruleIdentity, ruleIdentity)) {
        return;
      }
      // The grouping rule may have changed since we were last enabled. Drop any pending
      // retry first - it closed over the old group and would otherwise recreate a stale
      // summary via reconcile() after we cancel it below.
      retryHandler.removeCallbacksAndMessages(null);
      cancelAllSummaries();
      this.ruleIdentity = ruleIdentity;
      return;
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      // NotificationManagerCompat#getActiveNotifications() is unsupported before API 23, so
      // child counts can't be tracked and summaries can't be maintained.
      return;
    }
    enabled = true;
    this.ruleIdentity = ruleIdentity;
    createSummaryChannel();

    receivedListener = bundle -> runOnMainThread(() -> onReceived(bundle));
    clickListener = bundle -> runOnMainThread(() -> onRemoved(bundle));
    closeListener = bundle -> runOnMainThread(() -> onRemoved(bundle));
    RetenoNotifications.getReceived().addListener(receivedListener);
    RetenoNotifications.getClick().addListener(clickListener);
    RetenoNotifications.getClose().addListener(closeListener);
  }

  private void disable() {
    enabled = false;
    ruleIdentity = null;
    retryHandler.removeCallbacksAndMessages(null);
    if (receivedListener != null) {
      RetenoNotifications.getReceived().removeListener(receivedListener);
      receivedListener = null;
    }
    if (clickListener != null) {
      RetenoNotifications.getClick().removeListener(clickListener);
      clickListener = null;
    }
    if (closeListener != null) {
      RetenoNotifications.getClose().removeListener(closeListener);
      closeListener = null;
    }
    cancelAllSummaries();
  }

  private void createSummaryChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      // NotificationChannel doesn't exist before API 26.
      return;
    }
    NotificationChannel channel = new NotificationChannel(
      SUMMARY_CHANNEL_ID,
      "Grouped notifications summary",
      NotificationManager.IMPORTANCE_DEFAULT
    );
    notificationManager.createNotificationChannel(channel);
  }

  private void onReceived(Bundle bundle) {
    String group = resolveGroup(bundle);
    if (group == null) {
      return;
    }
    awaitChildAndReconcile(group, notificationId(bundle), 0);
  }

  private void awaitChildAndReconcile(String group, int notificationId, int attempt) {
    if (!enabled) {
      return;
    }
    if (hasChild(group, notificationId) || attempt >= MAX_POST_ATTEMPTS) {
      reconcile(group);
      return;
    }
    retryHandler.postDelayed(
      () -> awaitChildAndReconcile(group, notificationId, attempt + 1),
      RETRY_DELAY_MS
    );
  }

  private void onRemoved(Bundle bundle) {
    if (!enabled) {
      return;
    }
    String group = resolveGroup(bundle);
    if (group == null) {
      return;
    }
    awaitRemovalAndReconcile(group, notificationId(bundle), 0);
  }

  private void awaitRemovalAndReconcile(String group, int notificationId, int attempt) {
    if (!enabled) {
      return;
    }
    if (hasChild(group, notificationId) && attempt < MAX_REMOVAL_ATTEMPTS) {
      retryHandler.postDelayed(
        () -> awaitRemovalAndReconcile(group, notificationId, attempt + 1),
        RETRY_DELAY_MS
      );
      return;
    }
    reconcile(group);
  }

  private String resolveGroup(Bundle bundle) {
    return RetenoNotificationGroupingRuleProvider.resolveGroup(context, toStringMap(bundle));
  }

  private Map<String, String> toStringMap(Bundle bundle) {
    Map<String, String> payload = new HashMap<>();
    if (bundle == null) {
      return payload;
    }
    for (String key : bundle.keySet()) {
      Object value = bundle.get(key);
      payload.put(key, value == null ? null : value.toString());
    }
    return payload;
  }

  private int notificationId(Bundle bundle) {
    String interactionId = bundle == null ? null : bundle.getString("es_interaction_id");
    return interactionId == null ? 1 : interactionId.hashCode();
  }

  private boolean hasChild(String group, int notificationId) {
    for (StatusBarNotification sbn : notificationManager.getActiveNotifications()) {
      if (sbn.getId() == notificationId && isChildInGroup(sbn.getNotification(), group)) {
        return true;
      }
    }
    return false;
  }

  private void reconcile(String group) {
    if (!enabled) {
      return;
    }

    int childCount = 0;
    for (StatusBarNotification sbn : notificationManager.getActiveNotifications()) {
      if (isChildInGroup(sbn.getNotification(), group)) {
        childCount++;
      }
    }

    String tag = summaryTag(group);
    if (childCount < 2) {
      notificationManager.cancel(tag, SUMMARY_NOTIFICATION_ID);
      return;
    }
    if (ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
      != PackageManager.PERMISSION_GRANTED) {
      return;
    }

    Notification summary = new NotificationCompat.Builder(context, SUMMARY_CHANNEL_ID)
      .setContentTitle("New notifications")
      .setContentText("You have " + childCount + " new notifications")
      .setSmallIcon(resolveSmallIcon())
      .setGroup(group)
      .setGroupSummary(true)
      .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_CHILDREN)
      .setOnlyAlertOnce(true)
      .build();

    notificationManager.notify(tag, SUMMARY_NOTIFICATION_ID, summary);
  }

  private int resolveSmallIcon() {
    int icon = context.getResources().getIdentifier(
      "reteno_default_push_icon", "drawable", context.getPackageName()
    );
    return icon != 0 ? icon : android.R.drawable.ic_dialog_info;
  }

  private boolean isChildInGroup(Notification notification, String group) {
    return group.equals(notification.getGroup()) && !NotificationCompat.isGroupSummary(notification);
  }

  private String summaryTag(String group) {
    return SUMMARY_TAG_PREFIX + group;
  }

  private void cancelAllSummaries() {
    for (StatusBarNotification sbn : notificationManager.getActiveNotifications()) {
      String tag = sbn.getTag();
      if (tag != null && tag.startsWith(SUMMARY_TAG_PREFIX)) {
        notificationManager.cancel(tag, sbn.getId());
      }
    }
  }
}
