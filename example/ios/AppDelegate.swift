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
    Reteno.start(apiKey: "630A66AF-C1D3-4F2A-ACC1-0D51C38D2B05", isDebugMode: true)

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

  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let fcmToken = fcmToken else { return }

        Reteno.userNotificationService.processRemoteNotificationsToken(fcmToken)
    }
}
