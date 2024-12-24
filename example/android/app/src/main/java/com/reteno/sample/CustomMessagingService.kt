package com.reteno.sample // <-- make sure to replace it with your package name

import com.google.firebase.messaging.RemoteMessage
import com.reteno.fcm.RetenoFirebaseMessagingService

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
