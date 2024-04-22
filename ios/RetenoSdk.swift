import Foundation
import UserNotifications
import Reteno

@objc(RetenoSdk)
open class RetenoSdk: RCTEventEmitter {
    
    override init() {
        super.init()
        EventEmitter.sharedInstance.registerEventEmitter(externalEventEmitter: self);
        Reteno.userNotificationService.didReceiveNotificationUserInfo = {userInfo in
            EventEmitter.sharedInstance.dispatch(name: "reteno-push-received", body: userInfo)
        }
    }
    
    /// Base overide for RCTEventEmitter.
    ///
    /// - Returns: all supported events
    @objc open override func supportedEvents() -> [String] {
        return EventEmitter.sharedInstance.allEvents;
    }
    
    
    @objc(setDeviceToken:withResolver:withRejecter:)
    func setDeviceToken(deviceToken: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Reteno.userNotificationService.processRemoteNotificationsToken(deviceToken);
    }
    
    @objc(setUserAttributes:withResolver:withRejecter:)
    func setUserAttributes(payload: NSDictionary, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let externalUserId = payload["externalUserId"] as? String;
        
        do {
            let requestPayload = try RetenoUserAttributes.buildSetUserAttributesPayload(payload: payload);
            Reteno.updateUserAttributes(
                externalUserId: externalUserId,
                userAttributes: requestPayload.userAttributes,
                subscriptionKeys: requestPayload.subscriptionKeys,
                groupNamesInclude: requestPayload.groupNamesInclude,
                groupNamesExclude: requestPayload.groupNamesExclude
            );
            let res:[String:Bool] = ["success":true];
            
            resolve(res);
        } catch {
            reject("100", "Reteno iOS SDK Error", error);
        }
    }
    
    @objc(getInitialNotification:withRejecter:)
    func getInitialNotification(_ resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        var initialNotif: Any? = nil;
        let remoteUserInfo = bridge.launchOptions?[UIApplication.LaunchOptionsKey.remoteNotification];
        if (remoteUserInfo != nil) {
            initialNotif = remoteUserInfo;
        }
        if (initialNotif != nil) {
            resolve(initialNotif);
        } else {
            resolve(nil);
        }
    }
    
    @objc(logEvent:withResolver:withRejecter:)
    func logEvent(payload: NSDictionary, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        do {
            let requestPayload = try RetenoEvent.buildEventPayload(payload: payload);
            Reteno.logEvent(
                eventTypeKey: requestPayload.eventName,
                date: requestPayload.date,
                parameters: requestPayload.parameters,
                forcePush: requestPayload.forcePush
            );
            
            let res:[String:Bool] = ["success":true];
            
            resolve(res);
        } catch {
            reject("100", "Reteno iOS SDK Error", error);
        }
    }
    
    @objc(registerForRemoteNotifications)
    func registerForRemoteNotifications() -> Void {
        // Register for receiving push notifications
        // registerForRemoteNotifications will show the native iOS notification permission prompt
        Reteno.userNotificationService.registerForRemoteNotifications(with: [.sound, .alert, .badge], application: UIApplication.shared);
    }
    
    @objc(setAnonymousUserAttributes:withResolver:withRejecter:)
    func setAnonymousUserAttributes(payload: NSDictionary, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        do {
            let anonymousUser = try RetenoUserAttributes.buildSetAnonymousUserAttributesPayload(payload: payload)

            Reteno.updateAnonymousUserAttributes(userAttributes: anonymousUser)
            resolve(true)
        } catch {
            reject("100", "Reteno iOS SDK setAnonymousUserAttributes Error", error);
        }
    }
    
    @objc(pauseInAppMessages:withResolver:withRejecter:)
    func pauseInAppMessages(isPaused: Bool, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        Reteno.pauseInAppMessages(isPaused: isPaused);
        resolve(true);
    }
    
    @objc(setInAppLifecycleCallback)
        func setInAppLifecycleCallback() {
            Reteno.addInAppStatusHandler { inAppMessageStatus in
                switch inAppMessageStatus {
                case .inAppShouldBeDisplayed:
                    self.sendEvent(withName: "reteno-before-in-app-display", body: nil)
                case .inAppIsDisplayed:
                    self.sendEvent(withName: "reteno-on-in-app-display", body: nil)
                case .inAppShouldBeClosed(let action):
                    self.sendEvent(withName: "reteno-before-in-app-close", body: ["action": action])
                    Reteno.addLinkHandler { linkInfo in
                        self.sendEvent(withName: "reteno-in-app-custom-data-received", body: ["customData": linkInfo.customData])
                        UIApplication.shared.open(linkInfo.url)
                    }
                case .inAppIsClosed(let action):
                    self.sendEvent(withName: "reteno-after-in-app-close", body: ["action": action])
                case .inAppReceivedError(let error):
                    self.sendEvent(withName: "reteno-on-in-app-error", body: ["error": error])
                }
            }
        }
}
