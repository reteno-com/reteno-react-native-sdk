#import "NativeRetenoSdk.h"
#import "RetenoSdkTurboModulePOC-Swift.h"

@implementation NativeRetenoSdk

RCT_EXPORT_MODULE()

NativeRetenoSdkImpl *nativeretenosdk = [[NativeRetenoSdkImpl alloc] init];

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeRetenoSdkSpecJSI>(params);
}

- setDeviceToken {
    return [nativeretenosdk setDeviceToken];
}

- setUserAttributes {
    return [nativeretenosdk setUserAttributes];
}

- getInitialNotification {
    return [nativeretenosdk getInitialNotification];
}

- logEvent {
    return [nativeretenosdk logEvent];
}

- registerForRemoteNotifications {
    return [nativeretenosdk registerForRemoteNotifications];
}

- setAnonymousUserAttributes {
    return [nativeretenosdk setAnonymousUserAttributes];
}

- pauseInAppMessages {
    return [nativeretenosdk pauseInAppMessages];
}

- setInAppLifecycleCallback {
    return [nativeretenosdk setInAppLifecycleCallback];
}

- getRecommendations {
    return [nativeretenosdk getRecommendations];
}

- logRecommendationEvent {
    return [nativeretenosdk logRecommendationEvent];
}

- (NSDictionary *)getAppInboxMessages {
    return [nativeretenosdk getAppInboxMessages];
}

- onUnreadMessagesCountChanged {
    return [nativeretenosdk onUnreadMessagesCountChanged];
}

- markAsOpened {
    return [nativeretenosdk markAsOpened];
}

- markAllAsOpened {
    return [nativeretenosdk markAllAsOpened];
}

- (NSNumber *)getAppInboxMessagesCount {
    return [nativeretenosdk getAppInboxMessagesCount];
}

@end

