#import "RetenoSdk.h"

#import <React/RCTLog.h>
#import <ReactCommon/TurboModuleUtils.h>
#import <ReactCommon/TurboModuleBinding.h>
#import "React/RCTConvert.h"

@implementation RetenoSdk

RCT_EXPORT_MODULE()

- (void)emitOnRetenoPushReceived:(NSDictionary *)userInfo {
  [self emitOnRetenoPushReceived:userInfo];
}

- (void)emitOnRetenoPushClicked:(NSDictionary *)userInfo {
  [self emitOnRetenoPushClicked:userInfo];
}

- (void)emitOnRetenoPushButtonClicked:(NSDictionary *)actionData {
  [self emitOnRetenoPushButtonClicked:actionData];
}

- (void)emitBeforeInAppDisplayHandler {
  [self emitBeforeInAppDisplayHandler];
}

- (void)emitOnInAppDisplayHandler {
  [self emitOnInAppDisplayHandler];
}

- (void)emitBeforeInAppCloseHandler {
  [self emitBeforeInAppCloseHandler];
}

- (void)emitAfterInAppCloseHandler {
  [self emitAfterInAppCloseHandler];
}

- (void)emitAddInAppMessageCustomDataHandler:(NSDictionary *)customData {
  [self emitAddInAppMessageCustomDataHandler:customData];
}

- (void)emitOnInAppErrorHandler:(NSString *)error {
  [self emitOnInAppErrorHandler:error];
}

- (void)emitUnreadMessagesCountHandler:(NSNumber *)count {
  [self emitUnreadMessagesCountHandler:count];
}

// TurboModule integration
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeRetenoSdkSpecJSI>(params);
}

- (void)addListener:(NSString *)event {
    RCTLogInfo(@"Listener added for event: %@", event);
}

- (void)removeListeners:(double)count {
    RCTLogInfo(@"Listeners removed: %f", count);
}

- (void)forcePushData:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    @try {
        resolve(@{@"status": @"success"});
    } @catch (NSException *exception) {
        reject(@"force_push_data_failed", exception.reason, nil);
    }
}

- (void)getInitialNotification:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    @try {
        NSDictionary *initialNotification = @{@"title": @"Welcome", @"body": @"Hello from Reteno!"};
        resolve(initialNotification);
    } @catch (NSException *exception) {
        reject(@"get_initial_notification_failed", exception.reason, nil);
    }
}

- (void)getAppInboxMessages:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    NSNumber *page = payload[@"page"];
    NSNumber *pageSize = payload[@"pageSize"];
    NSString *statusString = payload[@"status"];

    [[Reteno sharedInstance] getAppInboxMessagesWithPage:page pageSize:pageSize status:statusString completion:^(NSDictionary *result, NSError *error) {
        if (error) {
            reject(@"100", @"Reteno iOS SDK Error", error);
        } else {
            resolve(result);
        }
    }];
}

- (void)getAppInboxMessagesCount:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [[Reteno sharedInstance] getAppInboxMessagesCountWithCompletion:^(NSNumber *count, NSError *error) {
        if (error) {
            reject(@"100", @"Reteno iOS SDK Error", error);
        } else {
            resolve(count);
        }
    }];
}

- (void)getRecommendations:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  NSString *recomVariantId = payload[@"recomVariantId"];
  NSArray *productIds = payload[@"productIds"];
  NSString *categoryId = payload[@"categoryId"];
  NSArray *filters = payload[@"filters"];
  NSArray *fields = payload[@"fields"];
  
  if (!recomVariantId || !productIds || !categoryId || !filters || !fields) {
    NSError *error = [NSError errorWithDomain:@"RetenoSdk" code:100 userInfo:@{NSLocalizedDescriptionKey: @"Invalid payload"}];
    reject(@"100", @"Invalid payload", error);
    return;
  }
  
  // Convert filters to required type
  NSMutableArray *recomFilters = [NSMutableArray array];
  for (NSDictionary *filter in filters) {
    NSString *name = filter[@"name"];
    NSArray *values = filter[@"values"];
    if (name && values) {
      [recomFilters addObject:@{@"name": name, @"values": values}];
    }
  }

  [[Reteno recommendations] getRecomsWithVariantId:recomVariantId
                                         productIds:productIds
                                         categoryId:categoryId
                                            filters:recomFilters
                                             fields:fields
                                        completion:^(NSArray *recommendations, NSError *error) {
    if (error) {
      reject(@"100", @"Failed to get recommendations", error);
    } else {
      NSMutableArray *result = [NSMutableArray array];
      for (id recommendation in recommendations) {
        [result addObject:@{
          @"productId": [recommendation productId],
          @"name": [recommendation name],
          @"description": [recommendation description] ?: @"",
          @"imageUrl": [[recommendation imageUrl] absoluteString] ?: @"",
          @"price": @([recommendation price])
        }];
      }
      resolve(result);
    }
  }];
}

- (void)logEvent:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSString *eventTypeKey = payload[@"eventTypeKey"];
    NSDate *date = payload[@"date"];
    NSDictionary *parameters = payload[@"parameters"];
    BOOL forcePush = [payload[@"forcePush"] boolValue];

    [[Reteno events] logEventWithTypeKey:eventTypeKey
                                    date:date
                               parameters:parameters
                                forcePush:forcePush];
    resolve(@{@"success": @(YES)});
  }
  @catch (NSException *exception) {
    NSError *error = [NSError errorWithDomain:@"RetenoSdk" code:100 userInfo:@{NSLocalizedDescriptionKey: exception.reason}];
    reject(@"100", @"Failed to log event", error);
  }
}


- (void)logRecommendationEvent:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  @try {
    NSString *recomVariantId = payload[@"recomVariantId"];
    NSString *action = payload[@"action"];
    NSArray *productIds = payload[@"productIds"];

    if (!recomVariantId || !action || !productIds) {
      NSError *error = [NSError errorWithDomain:@"RetenoSdk" code:100 userInfo:@{NSLocalizedDescriptionKey: @"Invalid payload"}];
      reject(@"100", @"Invalid payload", error);
      return;
    }

    [[Reteno recommendations] logEventWithVariantId:recomVariantId action:action productIds:productIds];
    resolve(@{@"success": @(YES)});
  }
  @catch (NSException *exception) {
    NSError *error = [NSError errorWithDomain:@"RetenoSdk" code:100 userInfo:@{NSLocalizedDescriptionKey: exception.reason}];
    reject(@"100", @"Failed to log recommendation event", error);
  }
}


- (void)markAllAsOpened:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[Reteno inbox] markAllAsOpenedWithCompletion:^(NSError *error) {
    if (error) {
      reject(@"100", @"Failed to mark all as opened", error);
    } else {
      resolve(@(YES));
    }
  }];
}

- (void)markAsOpened:(NSArray *)messageIds resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[Reteno inbox] markAsOpenedWithMessageIds:messageIds completion:^(NSError *error) {
    if (error) {
      reject(@"100", @"Failed to mark messages as opened", error);
    } else {
      resolve(@(YES));
    }
  }];
}

- (void)onUnreadMessagesCountChanged {
  [[Reteno inbox] onUnreadMessagesCountChanged:^(NSUInteger unreadCount) {
    [self sendEventWithName:@"UnreadMessagesCountChanged" body:@{@"unreadCount": @(unreadCount)}];
  }];
}

- (void)pauseInAppMessages:(BOOL)isPaused resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[Reteno inAppMessages] setPaused:isPaused];
  resolve(@{@"success": @(YES)});
}

- (void)registerForRemoteNotifications:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[UIApplication sharedApplication] registerForRemoteNotifications];
  resolve(@{@"success": @(YES)});
}

- (void)removeInAppLifecycleCallback {
  [[Reteno inAppMessages] setLifecycleCallback:nil];
}

- (void)setAnonymousUserAttributes:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  @try {
    [[Reteno user] setAnonymousAttributes:payload];
    resolve(@{@"success": @(YES)});
  }
  @catch (NSException *exception) {
    NSError *error = [NSError errorWithDomain:@"RetenoSdk" code:100 userInfo:@{NSLocalizedDescriptionKey: exception.reason}];
    reject(@"100", @"Failed to set anonymous user attributes", error);
  }
}

- (void)setDeviceToken:(NSString *)deviceToken resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[Reteno notifications] setDeviceToken:deviceToken];
  resolve(@{@"success": @(YES)});
}

- (void)setInAppLifecycleCallback {
  [[Reteno inAppMessages] setLifecycleCallback:^(NSString *eventName, NSDictionary *details) {
    [self sendEventWithName:@"InAppLifecycleEvent" body:@{@"eventName": eventName, @"details": details}];
  }];
}

- (void)setUserAttributes:(NSDictionary *)payload resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  @try {
    [[Reteno user] setAttributes:payload];
    resolve(@{@"success": @(YES)});
  }
  @catch (NSException *exception) {
    NSError *error = [NSError errorWithDomain:@"RetenoSdk" code:100 userInfo:@{NSLocalizedDescriptionKey: exception.reason}];
    reject(@"100", @"Failed to set user attributes", error);
  }
}

- (void)unsubscribeAllMessagesCountChanged {}

- (void)unsubscribeMessagesCountChanged {}

- (void)updatePushPermissionStatusAndroid:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {}

@end
