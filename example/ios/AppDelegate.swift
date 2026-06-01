import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import reteno_react_native_sdk

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()

    // Cold-start push → in-app: register Reteno as the notification-center delegate before
    // didFinishLaunchingWithOptions returns, so iOS delivers the notification response that
    // launched the app. The RN module's own init() runs too late (lazy instantiation).
    // JS initialize() then completes startup via Reteno.delayedSetup(), replaying the push.
    RetenoSdk.delayedStart()

    let delegate = ReactNativeDelegate()
    delegate.dependencyProvider = RCTAppDependencyProvider()
    let buildVersion = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? ""
    delegate.initialProps = ["appVersion": buildVersion]
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
