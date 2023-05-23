## Installation

1. Follow `Step 1` described in iOS SDK setup guide: [link](https://docs.reteno.com/reference/ios#step-1-add-the-notification-service-extension)

2. Modify your cocoapod file to contain next dependencies:

```

target 'NotificationServiceExtension' do
  pod 'Reteno', '1.5.4'
  pod 'Sentry', '8.2.0', :modular_headers => true

end

target 'RetenoSdkExample' do
  ...
  pod 'Reteno', '1.5.4'
  pod 'Sentry', '8.2.0', :modular_headers => true
end

```

3. Run next command from root of your project:

```sh
yarn add reteno-react-native-sdk
```

4. Next step for iOS is to call `Reteno.start` inside of your `AppDelegate` file. If you have migrated to `AppDelegate.swift`, follow `Step 3` in iOS SDK setup guide: [link](https://docs.reteno.com/reference/ios#step-3-import-reteno-into-your-app-delegate)

5. (Skip this, if you have `AppDelegate.swift`) If you have `AppDelegate.m`, then you need to do some manipulations;

Create `RetenoTransitionLayer.swift` file; Go to your project in Xcode and create new swift file under your target; When system will ask if you want to create bridge file also, agree

After that put next code in your `RetenoTransitionLayer.swift` file:

```swift
import Foundation
import Reteno

@objc public class RetenoTransitionLayer: NSObject {
  @objc class func setup(forApplication application: UIApplication) {
    Reteno.start(apiKey: "SDK_API_KEY");

    // Register for receiving push notifications
    // registerForRemoteNotifications will show the native iOS notification permission prompt
    // Provide UNAuthorizationOptions or use default
    Reteno.userNotificationService.registerForRemoteNotifications(with: [.sound, .alert, .badge], application: application);
  }

  @objc class func processRemoteNotificationsToken(withDeviceToken token: Data) {
    let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined();
    Reteno.userNotificationService.processRemoteNotificationsToken(tokenString);
  }

  @objc class func processRemoteNotificationsToken(withFCMToken fcmToken: String?) {
    guard let fcmToken = fcmToken else { return }
    Reteno.userNotificationService.processRemoteNotificationsToken(fcmToken);
  }
}

```

Then go to `AppDelegate.m` and modify your code to contain `RetenoTransitionLayer` setup logic

```objc
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
/// insert this line
  [RetenoTransitionLayer setupForApplication:application];

  RCTAppSetupPrepareApp(application);

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
```

If you get an "Use of undeclared identifier 'RetenoTransitionLayer'" error here, it means that you need to create a Bridging header file yourself, here's how to do that:

In Xcode press File > New > File > Header File

Save it with `YourProjectName-Bridging-Header.h` name, make sure to replace YourProjectName with your ios Xcode project name, if we were creating this file for our Reteno example project, we would create it as `RetenoSdkExample-Bridging-Header`, the ".h" extension will be put automatically.

Delete the contents of this file, and replace them with just 1 import

```objc
#import <React/RCTBridgeModule.h>
```

Finally, you need to import this header in your AppDelegate header file (AppDelegate.h) as `RetenoSdkExample-Swift.h`

```objc
#import "RetenoSdkExample-Swift.h"
```

And that's it, you should be good to go.

This is needed in order to use Objective-C and Swift files together in a single project.
You can read more about [importing swift](https://developer.apple.com/documentation/swift/importing-swift-into-objective-c) and [bridging headers](https://developer.apple.com/documentation/swift/importing-objective-c-into-swift), [react-native docs](https://reactnative.dev/docs/native-modules-ios#exporting-swift) exporting swift section.

6. Follow `Step 4` described in iOS SDK setup guide: [link](https://docs.reteno.com/reference/ios#step-4-add-app-groups)

7. Add `Push Notification` capability to your main app target (not `NotificationServiceExtension`!)l

8. Modify your `AppDelegate.m` to support `didRegisterForRemoteNotificationsWithDeviceToken` method:

```objc

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [RetenoTransitionLayer processRemoteNotificationsTokenWithDeviceToken:deviceToken];
}

```

9. If you are using `FirebaseMessaging` for push notifications, follow next [guide](./firebase-ios.md)
