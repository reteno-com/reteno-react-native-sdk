import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Reteno
import Firebase

@main
class AppDelegate: RCTAppDelegate, MessagingDelegate {
  override func application(_ application: UIApplication,
      didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        FirebaseApp.configure()

        // Initialize Reteno SDK
    Reteno.start(apiKey: "YOUR_SDK_API_KEY")

    // Register for push notifications
    Reteno.userNotificationService.registerForRemoteNotifications(
        with: [.sound, .alert, .badge],
        application: application
    )

    self.moduleName = "RetenoSdkExample"
    self.dependencyProvider = RCTAppDependencyProvider()
    self.initialProps = [:]

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }

  // Handle push notification token registration
  // override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
  //       let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
  //       Reteno.userNotificationService.processRemoteNotificationsToken(tokenString)
  //   }

  override func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let fcmToken = fcmToken else { return }

        Reteno.userNotificationService.processRemoteNotificationsToken(fcmToken)
    }

  // Handle push notifications received when the app is in foreground
  override func application(_ application: UIApplication,
                            didReceiveRemoteNotification userInfo: [AnyHashable: Any],
                            fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    Reteno.userNotificationService.application(application, didReceiveRemoteNotification: userInfo, fetchCompletionHandler: completionHandler)
  }
}
