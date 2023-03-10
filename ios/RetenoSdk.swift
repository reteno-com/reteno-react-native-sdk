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
        print("setUserAttributes was called")
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
}
