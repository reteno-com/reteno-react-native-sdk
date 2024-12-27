#import <Foundation/Foundation.h>
#import <RetenoSdkSpec/RetenoSdkSpec.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface RetenoSdk : NativeRetenoSdkSpecBase <NativeRetenoSdkSpec>

- (void)emitOnRetenoPushReceived:(NSDictionary *)userInfo;
- (void)emitOnRetenoPushClicked:(NSDictionary *)userInfo;
- (void)emitOnRetenoPushButtonClicked:(NSDictionary *)actionData;
- (void)emitBeforeInAppDisplayHandler;
- (void)emitOnInAppDisplayHandler;
- (void)emitBeforeInAppCloseHandler;
- (void)emitAfterInAppCloseHandler;
- (void)emitAddInAppMessageCustomDataHandler:(NSDictionary *)customData;
- (void)emitOnInAppErrorHandler:(NSString *)error;
- (void)emitUnreadMessagesCountHandler:(NSNumber *)count;

- (void)forcePushData:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject;

- (void)getAppInboxMessages:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)getAppInboxMessagesCount:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)getRecommendations:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)logEvent:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)logRecommendationEvent:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)markAllAsOpened:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)markAsOpened:(NSArray *)messageIds resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)onUnreadMessagesCountChanged;
- (void)pauseInAppMessages:(BOOL)isPaused resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)registerForRemoteNotifications:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)removeInAppLifecycleCallback;
- (void)setAnonymousUserAttributes:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)setDeviceToken:(NSString *)deviceToken resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)setInAppLifecycleCallback;
- (void)setUserAttributes:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)unsubscribeAllMessagesCountChanged;
- (void)unsubscribeMessagesCountChanged;
- (void)updatePushPermissionStatusAndroid:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
