#import "AppDelegate.h"
#import <Firebase.h>
#import <FirebaseCore/FirebaseCore.h>

#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  NSLog(@"Failed to register for remote notifications: %@", error);
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
 [RetenoTransitionLayer processRemoteNotificationsTokenWithDeviceToken:deviceToken];
}

// - (void)messaging:(FIRMessaging *)messaging didReceiveRegistrationToken:(nullable NSString *)fcmToken {
//   [RetenoTransitionLayer processRemoteNotificationsTokenWithFCMToken:fcmToken];
// }

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // [FIRApp configure];
  // [FIRMessaging messaging].delegate = self;
  [RetenoTransitionLayer setupForApplication:application];
  self.moduleName = @"RetenoSdkExample";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
