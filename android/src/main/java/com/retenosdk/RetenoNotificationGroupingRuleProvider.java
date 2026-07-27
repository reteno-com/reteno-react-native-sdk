package com.retenosdk;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.text.TextUtils;

import com.reteno.push.RetenoNotifications;

import java.util.Map;

/** Restores notification grouping before React Native and push services start. */
public final class RetenoNotificationGroupingRuleProvider extends ContentProvider {
  private static final String PREFERENCES = "com.retenosdk.notification-grouping-rule";
  private static final String PAYLOAD_KEY = "payloadKey";
  private static final String GROUP_ID = "groupId";

  @Override
  public boolean onCreate() {
    Context context = getContext();
    if (context != null) {
      restore(context);
    }
    return true;
  }

  static void configure(Context context, String payloadKey, String groupId) {
    SharedPreferences.Editor editor = preferences(context).edit().clear();
    if (!TextUtils.isEmpty(payloadKey)) {
      editor.putString(PAYLOAD_KEY, payloadKey);
    } else if (!TextUtils.isEmpty(groupId)) {
      editor.putString(GROUP_ID, groupId);
    }
    editor.commit();
    install(payloadKey, groupId);
  }

  private static void restore(Context context) {
    SharedPreferences preferences = preferences(context);
    install(
      preferences.getString(PAYLOAD_KEY, null),
      preferences.getString(GROUP_ID, null)
    );
  }

  private static SharedPreferences preferences(Context context) {
    return context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
  }

  private static void install(String payloadKey, String groupId) {
    if (!TextUtils.isEmpty(payloadKey)) {
      RetenoNotifications.setGroupingRule((Map<String, String> payload) -> {
        String value = payload.get(payloadKey);
        return TextUtils.isEmpty(value) ? null : value;
      });
    } else if (!TextUtils.isEmpty(groupId)) {
      RetenoNotifications.setGroupingRule((Map<String, String> payload) -> groupId);
    } else {
      RetenoNotifications.setGroupingRule(null);
    }
  }

  @Override
  public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
    return null;
  }

  @Override
  public String getType(Uri uri) {
    return null;
  }

  @Override
  public Uri insert(Uri uri, ContentValues values) {
    return null;
  }

  @Override
  public int delete(Uri uri, String selection, String[] selectionArgs) {
    return 0;
  }

  @Override
  public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
    return 0;
  }
}
