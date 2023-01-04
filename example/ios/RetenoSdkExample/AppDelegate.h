#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
#import "RetenoSdkExample-Swift.h"
#import <FirebaseMessaging/FirebaseMessaging.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, FIRMessagingDelegate>

@property (nonatomic, strong) UIWindow *window;



@end
