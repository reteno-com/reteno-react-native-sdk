package com.reteno.sample

import android.Manifest
import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.soloader.SoLoader
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.reteno.push.RetenoNotifications
import com.retenosdk.RetenoNotificationGroupingRuleProvider

class MainApplication : Application(), ReactApplication {

  companion object {
    private const val SUMMARY_CHANNEL_ID = "reteno_demo_group_summary"
    // The "received" event fires on the main thread while the SDK posts the push's own
    // notification on a background thread — there's no ordering guarantee between the two,
    // and posting can take longer than usual (e.g. downloading a BigPictureStyle image). A
    // fixed delay is a heuristic, not a guarantee: if posting is slower than this, the summary
    // is simply skipped for this push and shown on the next one instead of undercounting silently.
    private const val SUMMARY_CHECK_DELAY_MS = 500L
  }

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList = PackageList(this).packages
    )
  }

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      loadReactNative(this)
    }
    createSummaryNotificationChannel()
    RetenoNotifications.received.addListener { bundle -> onPushReceivedForGrouping(bundle) }
  }

  private fun createSummaryNotificationChannel() {
    val channel = NotificationChannel(
      SUMMARY_CHANNEL_ID,
      "Grouped notifications summary",
      NotificationManager.IMPORTANCE_DEFAULT
    )
    NotificationManagerCompat.from(this).createNotificationChannel(channel)
  }

  private fun onPushReceivedForGrouping(bundle: Bundle) {
    val payload = bundle.keySet().associateWith { bundle.getString(it) }
    val group = RetenoNotificationGroupingRuleProvider.resolveGroup(this, payload) ?: return
    Handler(Looper.getMainLooper()).postDelayed(
      { showGroupSummaryNotification(group) },
      SUMMARY_CHECK_DELAY_MS
    )
  }

  private fun showGroupSummaryNotification(group: String) {
    val manager = NotificationManagerCompat.from(this)
    // Exclude the summary itself from the count — once posted, it also carries this group key.
    val groupedCount = manager.activeNotifications.count {
      it.notification.group == group && !NotificationCompat.isGroupSummary(it.notification)
    }
    if (groupedCount < 2) return

    if (ActivityCompat.checkSelfPermission(
        this,
        Manifest.permission.POST_NOTIFICATIONS
      ) != PackageManager.PERMISSION_GRANTED
    ) return

    val summary = NotificationCompat.Builder(this, SUMMARY_CHANNEL_ID)
      .setContentTitle("New notifications")
      .setContentText("You have $groupedCount new notifications")
      .setSmallIcon(R.mipmap.ic_launcher)
      .setGroup(group)
      .setGroupSummary(true)
      // Prevent a duplicate alert (sound/vibration) on top of the child notification's own alert.
      .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_CHILDREN)
      .setOnlyAlertOnce(true)
      .setAutoCancel(true)
      .build()

    manager.notify(group.hashCode(), summary)
  }
}
