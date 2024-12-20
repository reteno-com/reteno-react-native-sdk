#import "RetenoSdk.h"

@implementation RetenoSdk

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(setDeviceToken:(NSString *)deviceToken resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        [RetenoSdk setDeviceToken:deviceToken];
        resolve(@(YES));
    } @catch (NSException *exception) {
        reject(@"SET_DEVICE_TOKEN_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(getInitialNotification:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        id notification = [RetenoSdk getInitialNotification];
        if (notification) {
            resolve(notification);
        } else {
            resolve(nil);
        }
    } @catch (NSException *exception) {
        reject(@"GET_INITIAL_NOTIFICATION_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(setUserAttributes:(NSDictionary *)payload resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        [RetenoSdk setUserAttributes:payload completion:^(NSError * _Nullable error) {
            if (error) {
                reject(@"SET_USER_ATTRIBUTES_ERROR", error.localizedDescription, error);
            } else {
                resolve(@(YES));
            }
        }];
    } @catch (NSException *exception) {
        reject(@"SET_USER_ATTRIBUTES_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(registerForRemoteNotifications:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        [RetenoSdk registerForRemoteNotificationsWithResolve:^(BOOL success) {
            if (success) {
                resolve(@(YES));
            } else {
                reject(@"REMOTE_NOTIFICATION_ERROR", @"Failed to register for remote notifications", nil);
            }
        } rejecter:^(NSError * _Nonnull error) {
            reject(@"REMOTE_NOTIFICATION_EXCEPTION", error.localizedDescription, error);
        }];
    } @catch (NSException *exception) {
        reject(@"REMOTE_NOTIFICATION_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(setAnonymousUserAttributes:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        auto anonymousUser = [RetenoSdk setAnonymousUserAttributes:payload];
        resolve(@(YES));
    } @catch (NSException *exception) {
        reject(@"SET_ANON_USER_ATTRIBUTES_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(pauseInAppMessages:(BOOL)isPaused
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        [RetenoSdk pauseInAppMessages:isPaused];
        resolve(@(YES));
    } @catch (NSException *exception) {
        reject(@"PAUSE_IN_APP_MESSAGES_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(setInAppLifecycleCallback:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        [RetenoSdk setInAppLifecycleCallback:^(NSDictionary *status) {
            resolve(status);
        }];
    } @catch (NSException *exception) {
      reject(@"SET_IN_APP_CALLBACK_ERROR", exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(getRecommendations:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *recomVariantId = payload[@"recomVariantId"];
        NSArray *productIds = payload[@"productIds"];
        NSString *categoryId = payload[@"categoryId"];
        NSArray *filters = payload[@"filters"];
        NSArray *fields = payload[@"fields"];

        if (!recomVariantId || !productIds || !categoryId || !filters || !fields) {
            reject(@"INVALID_PAYLOAD", @"Missing required fields in payload", nil);
            return;
        }

        NSArray<RecomFilter *> *recomFilters = [filters map:^id(NSDictionary *dict) {
            NSString *name = dict[@"name"];
            NSArray *values = dict[@"values"];
            if (!name || !values) return nil;
            return [[RecomFilter alloc] initWithName:name values:values];
        }];

        [Reteno.recommendations() getRecomsWithRecomVariantId:recomVariantId
                                                    productIds:productIds
                                                   categoryId:categoryId
                                                     filters:recomFilters
                                                      fields:fields
                                                    callback:^(NSArray<Recommendation *> *recommendations, NSError *error) {
            if (error) {
                reject(@"GET_RECOMMENDATIONS_ERROR", error.localizedDescription, error);
            } else {
                NSMutableArray *result = [NSMutableArray array];
                for (Recommendation *recommendation in recommendations) {
                    [result addObject:@{
                        @"productId": recommendation.productId ?: @"",
                        @"name": recommendation.name ?: @"",
                        @"description": recommendation.description ?: @"",
                        @"imageUrl": recommendation.imageUrl.absoluteString ?: @"",
                        @"price": @(recommendation.price)
                    }];
                }
                resolve(result);
            }
        }];
    } @catch (NSException *exception) {
        reject(@"GET_RECOMMENDATIONS_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(logRecommendationEvent:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *recomVariantId = payload[@"recomVariantId"];
        NSArray *impressions = payload[@"impressions"];
        NSArray *clicks = payload[@"clicks"];
        BOOL forcePush = [payload[@"forcePush"] boolValue];

        if (!recomVariantId || !impressions || !clicks) {
            reject(@"INVALID_PAYLOAD", @"Missing required fields in payload", nil);
            return;
        }

        NSArray<RecomEvent *> *impressionEvents = [impressions map:^id(NSDictionary *impression) {
            return [[RecomEvent alloc] initWithDate:[NSDate date]
                                         productId:impression[@"productId"]];
        }];

        NSArray<RecomEvent *> *clickEvents = [clicks map:^id(NSDictionary *click) {
            return [[RecomEvent alloc] initWithDate:[NSDate date]
                                         productId:click[@"productId"]];
        }];

        [Reteno.recommendations() logEventWithRecomVariantId:recomVariantId
                                                 impressions:impressionEvents
                                                     clicks:clickEvents
                                                  forcePush:forcePush
                                                   callback:^(NSError *error) {
            if (error) {
                reject(@"LOG_RECOMMENDATION_EVENT_ERROR", error.localizedDescription, error);
            } else {
                resolve(@(YES));
            }
        }];
    } @catch (NSException *exception) {
        reject(@"LOG_RECOMMENDATION_EVENT_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(getAppInboxMessages:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSNumber *page = payload[@"page"];
        NSNumber *pageSize = payload[@"pageSize"];

        [Reteno.inbox() downloadMessagesWithPage:page pageSize:pageSize callback:^(InboxResponse *response, NSError *error) {
            if (error) {
                reject(@"GET_APP_INBOX_MESSAGES_ERROR", error.localizedDescription, error);
            } else {
                NSMutableArray *messages = [NSMutableArray array];
                for (InboxMessage *message in response.messages) {
                    [messages addObject:@{
                        @"id": message.id ?: @"",
                        @"createdDate": @([message.createdDate timeIntervalSince1970]),
                        @"title": message.title ?: @"",
                        @"content": message.content ?: @"",
                        @"imageURL": message.imageURL.absoluteString ?: @"",
                        @"linkURL": message.linkURL.absoluteString ?: @"",
                        @"isNew": @(message.isNew)
                    }];
                }
                resolve(@{
                    @"messages": messages,
                    @"totalPages": @(response.totalPages)
                });
            }
        }];
    } @catch (NSException *exception) {
        reject(@"GET_APP_INBOX_MESSAGES_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(onUnreadMessagesCountChanged) {
    Reteno.inbox().onUnreadMessagesCountChanged = ^(NSInteger count) {
        [self sendEventWithName:@"reteno-unread-messages-count" body:@{ @"count": @(count) }];
    };
}

RCT_EXPORT_METHOD(markAsOpened:(NSArray<NSString *> *)messageIds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        [Reteno.inbox() markAsOpenedWithMessageIds:messageIds callback:^(NSError *error) {
            if (error) {
                reject(@"MARK_AS_OPENED_ERROR", error.localizedDescription, error);
            } else {
                resolve(@(YES));
            }
        }];
    } @catch (NSException *exception) {
        reject(@"MARK_AS_OPENED_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(markAllAsOpened:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        [Reteno.inbox() markAllAsOpenedWithCallback:^(NSError *error) {
            if (error) {
                reject(@"MARK_ALL_AS_OPENED_ERROR", error.localizedDescription, error);
            } else {
                resolve(@(YES));
            }
        }];
    } @catch (NSException *exception) {
        reject(@"MARK_ALL_AS_OPENED_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(getAppInboxMessagesCount:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        [Reteno.inbox() getUnreadMessagesCountWithCallback:^(NSInteger unreadCount, NSError *error) {
            if (error) {
                reject(@"GET_UNREAD_MESSAGES_COUNT_ERROR", error.localizedDescription, error);
            } else {
                resolve(@(unreadCount));
            }
        }];
    } @catch (NSException *exception) {
        reject(@"GET_UNREAD_MESSAGES_COUNT_EXCEPTION", exception.reason, nil);
    }
}

// TurboModule integration
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeRetenoSdkSpecJSI>(params);
}

@end
