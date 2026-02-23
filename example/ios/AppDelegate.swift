import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Reteno
import Firebase
import FirebaseMessaging

@main
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  // Optional: Add link handler BEFORE Reteno.start() to control browser opening on cold start.
  // Without this code, setAutoOpenLinks(false) will only work when the app is already running (warm start).

  private static let autoOpenLinksKey = "RetenoAutoOpenLinks"

  private static var autoOpenLinks: Bool {
    if UserDefaults.standard.object(forKey: autoOpenLinksKey) == nil {
      return true
    }
    return UserDefaults.standard.bool(forKey: autoOpenLinksKey)
  }

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()
    Messaging.messaging().delegate = self

    Reteno.addLinkHandler { linkInfo in
      NotificationCenter.default.post(
        name: NSNotification.Name("RetenoLinkReceived"),
        object: nil,
        userInfo: [
          "customData": linkInfo.customData as Any,
          "url": linkInfo.url?.absoluteString as Any
        ]
      )

      if AppDelegate.autoOpenLinks, let url = linkInfo.url {
        UIApplication.shared.open(url)
      }
    }

    Reteno.start(apiKey: "630A66AF-C1D3-4F2A-ACC1-0D51C38D2B05", isDebugMode: true)

    // Register for push notifications
    Reteno.userNotificationService.registerForRemoteNotifications(
      with: [.sound, .alert, .badge],
      application: application
    )

    let delegate = ReactNativeDelegate()
    delegate.dependencyProvider = RCTAppDependencyProvider()
    delegate.initialProps = [:]
    let factory = RCTReactNativeFactory(delegate: delegate)

    self.reactNativeDelegate = delegate
    self.reactNativeFactory = factory

    self.window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "RetenoSdkExample",
      in: self.window,
      initialProperties: delegate.initialProps,
      launchOptions: launchOptions
    )

    return true
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

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  var initialProps: [AnyHashable: Any] = [:]

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
