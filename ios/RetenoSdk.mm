#import "RetenoSdk.h"

#import <React/RCTViewManager.h>
#import "React/RCTUIKit.h"
#import <ReactCommon/TurboModuleUtils.h>
#import <ReactCommon/TurboModuleBinding.h>

#ifdef __cplusplus
#import <react/bridgeless/BridgelessNativeModule.h>
#import <react/renderer/components/RCTComponentData.h>
#import <react/bridgeless/BridgelessNativeView.h>
#endif

@interface RetenoSdk : BridgelessNativeModule
@end

@implementation RetenoSdk

RCT_EXPORT_MODULE()

- (void)emitOnRetenoPushReceived:([String: Any] *)userInfo {
  [self onRetenoPushReceived:@(userInfo)]
}

- (void)emitOnRetenoPushClicked:([String: Any] *)userInfo {
  [self onRetenoPushClicked:@(userInfo)]
}

- (void)emitOnRetenoPushButtonClicked:([String: Any] *)actionData {
  [self onRetenoPushButtonClicked:@(actionData)]
}

- (void)emitBeforeInAppDisplayHandler {
  [self beforeInAppDisplayHandler]
}

- (void)emitOnInAppDisplayHandler {
  [self onInAppDisplayHandler]
}

- (void)emitBeforeInAppCloseHandler {
  [self beforeInAppCloseHandler]
}

- (void)emitAfterInAppCloseHandler {
  [self afterInAppCloseHandler]
}

- (void)emitAddInAppMessageCustomDataHandler:([String: Any] *)customData {
  [self addInAppMessageCustomDataHandler:@(customData)]
}

- (void)emitOnInAppErrorHandler:(String *)error {
  [self onInAppErrorHandler:@(error)]
}

- (void)emitUnreadMessagesCountHandler:(NSNumber *)count {
  [self unreadMessagesCountHandler:@(count)]
}

// TurboModule integration
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeRetenoSdkSpecJSI>(params);
}

@end
