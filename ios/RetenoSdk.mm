#import "RetenoSdk.h"

@implementation RetenoSdk

RCT_EXPORT_MODULE()

+ (void)emitPushReceived:(NSDictionary *)userInfo {
  [self onRetenoPushReceived:@(userInfo)]
}

+ (void)emitPushClicked:(NSDictionary *)userInfo {
  [self onRetenoPushClicked:@(userInfo)]
}

+ (void)emitPushButtonClicked:(NSDictionary *)actionData {
  [self onRetenoPushButtonClicked:@(actionData)]
}

//RCT_EXPORT_METHOD(getInitialNotification:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
//    @try {
//        id notification = [RetenoSdk getInitialNotification];
//        if (notification) {
//            resolve(notification);
//        } else {
//            resolve(nil);
//        }
//    } @catch (NSException *exception) {
//        reject(@"GET_INITIAL_NOTIFICATION_ERROR", exception.reason, nil);
//    }
//}
//
//RCT_EXPORT_METHOD(setUserAttributes:(NSDictionary *)payload resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
//    @try {
//        [RetenoSdk setUserAttributes:payload completion:^(NSError * _Nullable error) {
//            if (error) {
//                reject(@"SET_USER_ATTRIBUTES_ERROR", error.localizedDescription, error);
//            } else {
//                resolve(@(YES));
//            }
//        }];
//    } @catch (NSException *exception) {
//        reject(@"SET_USER_ATTRIBUTES_EXCEPTION", exception.reason, nil);
//    }
//}

// TurboModule integration
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeRetenoSdkSpecJSI>(params);
}

- (void)addListener:(NSString *)event { 
  <#code#>
}

- (void)forcePushData:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)getAppInboxMessages:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)getAppInboxMessagesCount:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)getInitialNotification:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)getRecommendations:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)logEvent:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)logRecommendationEvent:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)markAllAsOpened:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)markAsOpened:(NSArray *)messageIds resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)onUnreadMessagesCountChanged { 
  <#code#>
}

- (void)pauseInAppMessages:(BOOL)isPaused resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)registerForRemoteNotifications:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)removeInAppLifecycleCallback { 
  <#code#>
}

- (void)removeListeners:(double)count { 
  <#code#>
}

- (void)setAnonymousUserAttributes:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)setDeviceToken:(NSString *)deviceToken resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)setInAppLifecycleCallback { 
  <#code#>
}

- (void)setUserAttributes:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

- (void)unsubscribeAllMessagesCountChanged { 
  <#code#>
}

- (void)unsubscribeMessagesCountChanged { 
  <#code#>
}

- (void)updatePushPermissionStatusAndroid:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject { 
  <#code#>
}

@end
