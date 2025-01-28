import Foundation
import UserNotifications
import Reteno
import React

@objc(RetenoSdk)
open class RetenoSdk: RCTEventEmitter {

    override init() {
        super.init()

        Reteno.userNotificationService.didReceiveNotificationUserInfo = { userInfo in
            if let stringKeyedUserInfo = userInfo as? [String: Any] {
                self.sendEvent(withName: "onRetenoPushReceived", body: stringKeyedUserInfo)
            }
        }

        Reteno.userNotificationService.didReceiveNotificationResponseHandler = { response in
            let userInfo = response.notification.request.content.userInfo
            if let stringKeyedUserInfo = userInfo as? [String: Any] {
                self.sendEvent(withName: "onRetenoPushClicked", body: stringKeyedUserInfo)
            }
        }

        Reteno.userNotificationService.notificationActionHandler = { userInfo, action in
            if let stringKeyedUserInfo = userInfo as? [String: Any] {
                let actionData: [String: Any] = [
                    "userInfo": stringKeyedUserInfo,
                    "actionId": action.actionId,
                    "customData": action.customData as Any,
                    "actionLink": action.link as Any
                ]
                self.sendEvent(withName: "onRetenoPushButtonClicked", body: actionData)
            }
        }
    }

    // MARK: - RCTEventEmitter Overrides

    @objc
    override open func supportedEvents() -> [String]! {
        return [
            "onRetenoPushReceived",
            "onRetenoPushClicked",
            "onRetenoPushButtonClicked",
            "beforeInAppDisplayHandler",
            "onInAppDisplayHandler",
            "beforeInAppCloseHandler",
            "afterInAppCloseHandler",
            "addInAppMessageCustomDataHandler",
            "onInAppErrorHandler",
            "unreadMessagesCountHandler"
        ]
    }

    @objc
    override open static func requiresMainQueueSetup() -> Bool {
        return true
    }

    // MARK: - Exposed Methods

    @objc(setDeviceToken:withResolver:withRejecter:)
    func setDeviceToken(deviceToken: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        Reteno.userNotificationService.processRemoteNotificationsToken(deviceToken)
        resolve(["success": true])
    }

    @objc(setUserAttributes:withResolver:withRejecter:)
    func setUserAttributes(payload: NSDictionary, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        let externalUserId = payload["externalUserId"] as? String

        do {
            let requestPayload = try RetenoUserAttributes.buildSetUserAttributesPayload(payload: payload)
            Reteno.updateUserAttributes(
                externalUserId: externalUserId,
                userAttributes: requestPayload.userAttributes,
                subscriptionKeys: requestPayload.subscriptionKeys,
                groupNamesInclude: requestPayload.groupNamesInclude,
                groupNamesExclude: requestPayload.groupNamesExclude
            )
            resolve(["success": true])
        } catch {
            reject("100", "Reteno iOS SDK Error", error)
        }
    }

    @objc(getInitialNotification:withRejecter:)
    func getInitialNotification(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        UNUserNotificationCenter.current().getDeliveredNotifications { notifications in
            if let firstNotification = notifications.first {
                resolve(firstNotification.request.content.userInfo)
            } else {
                resolve(nil)
            }
        }
    }

    @objc(logEvent:withResolver:withRejecter:)
    func logEvent(payload: NSDictionary, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        do {
            let requestPayload = try RetenoEvent.buildEventPayload(payload: payload)
            Reteno.logEvent(
                eventTypeKey: requestPayload.eventName,
                date: requestPayload.date,
                parameters: requestPayload.parameters,
                forcePush: requestPayload.forcePush
            )
            resolve(["success": true])
        } catch {
            reject("100", "Reteno iOS SDK Error", error)
        }
    }

    @objc(registerForRemoteNotifications)
    func registerForRemoteNotifications() -> Void {
        Reteno.userNotificationService.registerForRemoteNotifications(with: [.sound, .alert, .badge], application: UIApplication.shared)
    }

    @objc(setAnonymousUserAttributes:withResolver:withRejecter:)
    func setAnonymousUserAttributes(payload: NSDictionary, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        do {
            let anonymousUser = try RetenoUserAttributes.buildSetAnonymousUserAttributesPayload(payload: payload)
            Reteno.updateAnonymousUserAttributes(userAttributes: anonymousUser)
            resolve(true)
        } catch {
            reject("100", "Reteno iOS SDK setAnonymousUserAttributes Error", error)
        }
    }

    @objc(pauseInAppMessages:withResolver:withRejecter:)
    func pauseInAppMessages(isPaused: Bool, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        Reteno.pauseInAppMessages(isPaused: isPaused)
        resolve(true)
    }

    @objc(setInAppLifecycleCallback)
    func setInAppLifecycleCallback() {
        Reteno.addInAppStatusHandler { inAppMessageStatus in
            switch inAppMessageStatus {
            case .inAppShouldBeDisplayed:
                self.sendEvent(withName: "beforeInAppDisplayHandler", body: nil)
            case .inAppIsDisplayed:
                self.sendEvent(withName: "onInAppDisplayHandler", body: nil)
            case .inAppShouldBeClosed(let action):
                self.sendEvent(withName: "beforeInAppCloseHandler", body: nil)
                Reteno.addLinkHandler { linkInfo in
                    self.sendEvent(withName: "addInAppMessageCustomDataHandler", body: linkInfo.customData)
                    if let url = linkInfo.url {
                        UIApplication.shared.open(url)
                    }
                }
            case .inAppIsClosed(let action):
                self.sendEvent(withName: "afterInAppCloseHandler", body: nil)
            case .inAppReceivedError(let error):
                self.sendEvent(withName: "onInAppErrorHandler", body: error.localizedDescription)
            }
        }
    }
  
    @objc(getRecommendations:withResolver:withRejecter:)
    func getRecommendations(payload: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        guard let recomVariantId = payload["recomVariantId"] as? String,
              let productIds = payload["productIds"] as? [String],
              let categoryId = payload["categoryId"] as? String,
              let filters = payload["filters"] as? [NSDictionary],
              let fields = payload["fields"] as? [String] else {
            let error = NSError(domain: "RetenoSdk", code: 100, userInfo: [NSLocalizedDescriptionKey: "Invalid payload"])
            reject("100", "Reteno iOS SDK Error: Invalid payload", error)
            return
        }
        var recomFilters: [RecomFilter]? = nil
        if let filters = filters as? [[String: Any]] {
            recomFilters = filters.compactMap { dict in
                guard let name = dict["name"] as? String, let values = dict["values"] as? [String] else {
                    return nil
                }
                return RecomFilter(name: name, values: values)
            }
        }
        
        Reteno.recommendations().getRecoms(recomVariantId: recomVariantId, productIds: productIds, categoryId: categoryId, filters: recomFilters, fields: fields) { (result: Result<[Recommendation], Error>) in
            
            switch result {
            case .success(let recommendations):
                let serializedRecommendations = recommendations.map { recommendation in
                    return [
                        "productId": recommendation.productId,
                        "name": recommendation.name,
                        "description": recommendation.description ?? "",
                        "imageUrl": recommendation.imageUrl?.absoluteString ?? "",
                        "price": recommendation.price
                    ]
                }
                resolve(serializedRecommendations)
                
            case .failure(let error):
                reject("100", "Reteno iOS SDK getRecommendations Error", error)
            }
        }
    }
    
    @objc(logRecommendationEvent:withResolver:withRejecter:)
    func logRecommendationEvent(payload: NSDictionary, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        
        guard let recomVariantId = payload["recomVariantId"] as? String,
              let impressions = payload["impressions"] as? [[String: Any]],
              let clicks = payload["clicks"] as? [[String: Any]],
              let forcePush = payload["forcePush"] as? Bool else {
            let error = NSError(domain: "InvalidPayload", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid payload"])
            reject("100", "Reteno iOS SDK logRecommendationEvent Error", error)
            return
        }
        
        var impressionEvents: [RecomEvent] = []
        var clickEvents: [RecomEvent] = []
        
        for impression in impressions {
            let productId = impression["productId"] as? String
            
            impressionEvents.append(RecomEvent(date: Date(), productId: productId ?? ""))
        }
        
        for click in clicks {
            let productId = click["productId"] as? String
            
            clickEvents.append(RecomEvent(date: Date(), productId: productId ?? ""))
        }
        
        Reteno.recommendations().logEvent(recomVariantId: recomVariantId, impressions: impressionEvents, clicks: clickEvents, forcePush: forcePush)
        
        let res: [String: Bool] = ["success": true]
        resolve(res)
    }
    
    @objc(getAppInboxMessages:withResolver:withRejecter:)
    func getAppInboxMessages(payload: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let page = payload["page"] as? Int
        let pageSize = payload["pageSize"] as? Int
        let statusString = payload["status"] as? String

      let status: AppInboxMessagesStatus? = {
              switch statusString?.uppercased() {
              case "OPENED":
                  return .opened
              case "UNOPENED":
                  return .unopened
              default:
                  return nil
              }
          }()
      
      Reteno.inbox().downloadMessages(page: page, pageSize: pageSize, status: status) { result in
            switch result {
            case .success(let response):
                let messages = response.messages.map { message in
                    return [
                        "id": message.id,
                        "createdDate": message.createdDate?.timeIntervalSince1970 as Any,
                        "title": message.title as Any,
                        "content": message.content as Any,
                        "imageURL": message.imageURL?.absoluteString as Any,
                        "linkURL": message.linkURL?.absoluteString as Any,
                        "isNew": message.isNew,
                    ]
                }
                resolve(["messages": messages, "totalPages": response.totalPages as Any])
                
            case .failure(let error):
                reject("100", "Reteno iOS SDK downloadMessages Error", error)
            }
        }
    }
    
    @objc(onUnreadMessagesCountChanged)
        func onUnreadMessagesCountChanged() {
            Reteno.inbox().onUnreadMessagesCountChanged = { count in
              self.unreadMessagesCountHandler(count: count as NSNumber)
            }
        }
    
    @objc(markAsOpened:withResolver:withRejecter:)
        func markAsOpened(messageIds: [String], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
            Reteno.inbox().markAsOpened(messageIds: messageIds) { result in
                switch result {
                case .success:
                    resolve(true)
                case .failure(let error):
                    reject("100", "Reteno iOS SDK markAsOpened Error", error)
                }
            }
        }
    
    @objc(markAllAsOpened:withRejecter:)
        func markAllAsOpened(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
            Reteno.inbox().markAllAsOpened { result in
                switch result {
                case .success:
                    resolve(true)
                case .failure(let error):
                    reject("100", "Reteno iOS SDK markAllAsOpened Error", error)
                }
            }
        }
    
    @objc(getAppInboxMessagesCount:withRejecter:)
        func getAppInboxMessagesCount(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
            Reteno.inbox().getUnreadMessagesCount { result in
                switch result {
                case .success(let unreadCount):
                    resolve(unreadCount)
                case .failure(let error):
                    reject("100", "Reteno iOS SDK getAppInboxMessagesCount Error", error)
                }
            }
        }
  
  @objc public weak var delegate: RetenoReactNativeSdkDelegate?
  
  private final func onRetenoPushReceived(userInfo: [String: Any]?) {
          delegate?.emitOnRetenoPushReceived(userInfo)
      }
  
  private final func onRetenoPushClicked(userInfo: [String: Any]?) {
          delegate?.emitOnRetenoPushClicked(userInfo)
      }
  
  private final func onRetenoPushButtonClicked(actionData: [String: Any]?) {
          delegate?.emitOnRetenoPushButtonClicked(actionData)
      }
  
  private final func beforeInAppDisplayHandler() {
          delegate?.emitBeforeInAppDisplayHandler()
      }
  
  private final func onInAppDisplayHandler() {
          delegate?.emitOnInAppDisplayHandler()
      }
  
  private final func beforeInAppCloseHandler() {
          delegate?.emitBeforeInAppCloseHandler()
      }
  
  private final func afterInAppCloseHandler() {
          delegate?.emitAfterInAppCloseHandler()
      }
  
  private final func addInAppMessageCustomDataHandler(customData: [String: Any]?) {
          delegate?.emitAddInAppMessageCustomDataHandler(customData)
      }
  
  private final func onInAppErrorHandler(error: String?) {
          delegate?.emitOnInAppErrorHandler(error)
      }
  
  private final func unreadMessagesCountHandler(count: NSNumber?) {
          delegate?.emitUnreadMessagesCountHandler(count)
      }
}
