package com.reteno.sample

import com.google.firebase.messaging.RemoteMessage
import com.reteno.fcm.RetenoFirebaseMessagingService

// <-- make sure to replace it with your package name
class CustomMessagingService : RetenoFirebaseMessagingService() {
  override fun onCreate() {
    super.onCreate()
    // Your code here
  }

  override fun onNewToken(token: String) {
    super.onNewToken(token)
    // Your code here
  }

  override fun onMessageReceived(message: RemoteMessage) {
    super.onMessageReceived(message)
    // Your code here
  }
}
