## Using Reteno RN SDK with Firebase Messaging

### Please note
This guide is for objective c based `AppDelegate`; If you have `AppDelegate.swift`, then just follow guide from iOS SDK for Firebase usage [link](https://docs.reteno.com/reference/ios#step-5-provide-device-token-to-the-sdk-via-next-method); 


1. Follow FirebaseMessaging setup guides;
2. Modify your `AppDelegate.h` file to implement `FIRMessagingDelegate` delegate
```objc
#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
#import "RetenoSdkExample-Swift.h"
// add this
#import <FirebaseMessaging/FirebaseMessaging.h>

// modify this and add FIRMessagingDelegate
@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, FIRMessagingDelegate>

@property (nonatomic, strong) UIWindow *window;

@end

```
3. Modify your `AppDelegate.m`'s `didFinishLaunchingWithOptions` method:

```objc
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  [FIRMessaging messaging].delegate = self;
  
  [RetenoTransitionLayer setupForApplication:application];
  ...
```
4. Add to `AppDelegate.m` `didReceiveRegistrationToken` method and call `RetenoTransitionLayer.processRemoteNotificationsTokenWithFCMToken` in it like this:

```objc
- (void)messaging:(FIRMessaging *)messaging didReceiveRegistrationToken:(nullable NSString *)fcmToken {
  [RetenoTransitionLayer processRemoteNotificationsTokenWithFCMToken:fcmToken];
}
```




