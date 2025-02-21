#import "NativeRetenoSdk.h"
#import <React/RCTBridgeModule.h>
#import <RetenoSdk/RetenoSdk-Swift.h>

@implementation NativeRetenoSdk

RCT_EXPORT_MODULE(RetenoSdk)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeRetenoSdkSpecJSI>(params);
}

@end

namespace facebook {
namespace react {

class NativeRetenoSdkSpecJSI : public ObjCTurboModule {
public:
    NativeRetenoSdkSpecJSI(const ObjCTurboModule::InitParams &params)
        : ObjCTurboModule(params), retenoSdk([[RetenoSdk alloc] init]) {}

    void setDeviceToken(NSString *deviceToken, JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk setDeviceToken:deviceToken];
        resolve(nullptr);
    }

    void setUserAttributes(NSDictionary *payload, JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk setUserAttributes:payload resolver:^(id result) {
            resolve(result);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            reject(code, message, error);
        }];
    }

    void getInitialNotification(JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk getInitialNotification:^(id result) {
            resolve(result);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            reject(code, message, error);
        }];
    }

    void logEvent(NSDictionary *payload, JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk logEvent:payload resolver:^(id result) {
            resolve(result);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            reject(code, message, error);
        }];
    }

    void registerForRemoteNotifications() override {
        [retenoSdk registerForRemoteNotifications];
    }

    void setAnonymousUserAttributes(NSDictionary *payload, JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk setAnonymousUserAttributes:payload resolver:^(id result) {
            resolve(result);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            reject(code, message, error);
        }];
    }

    void pauseInAppMessages(BOOL isPaused, JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk pauseInAppMessages:isPaused resolver:^(id result) {
            resolve(result);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            reject(code, message, error);
        }];
    }

    void setInAppLifecycleCallback() override {
        [retenoSdk setInAppLifecycleCallback];
    }

    void getRecommendations(NSDictionary *payload, JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk getRecommendations:payload resolver:^(id result) {
            resolve(result);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            reject(code, message, error);
        }];
    }

    void logRecommendationEvent(NSDictionary *payload, JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk logRecommendationEvent:payload resolver:^(id result) {
            resolve(result);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            reject(code, message, error);
        }];
    }

    void getAppInboxMessages(NSDictionary *payload, JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk getAppInboxMessages:payload resolver:^(id result) {
            resolve(result);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            reject(code, message, error);
        }];
    }

    void onUnreadMessagesCountChanged() override {
        [retenoSdk onUnreadMessagesCountChanged];
    }

    void markAsOpened(NSArray<NSString *> *messageIds, JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk markAsOpened:messageIds resolver:^(id result) {
            resolve(result);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            reject(code, message, error);
        }];
    }

    void markAllAsOpened(JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk markAllAsOpened:^(id result) {
            resolve(result);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            reject(code, message, error);
        }];
    }

    void getAppInboxMessagesCount(JS::NativeRetenoSdkSpec::Promise resolve, JS::NativeRetenoSdkSpec::Promise reject) override {
        [retenoSdk getAppInboxMessagesCount:^(id result) {
            resolve(result);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            reject(code, message, error);
        }];
    }

private:
    RetenoSdk *retenoSdk;
};

} // namespace react
} // namespace facebook
