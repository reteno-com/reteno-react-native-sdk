#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "RetenoSdkSpec.h"

@interface RetenoSdk : RCTEventEmitter <NativeRetenoSdkSpec>
@end