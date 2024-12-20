import Foundation
import UserNotifications
import Reteno

@objc(RetenoSdk)
open class RetenoSdk: NSObject {
    
    override init() {
        super.init()

        Reteno.userNotificationService.didReceiveNotificationUserInfo = {userInfo in
          if let stringKeyedUserInfo = userInfo as? [String: Any] {
                  EventDispatcher.dispatchPushReceived(userInfo: stringKeyedUserInfo)
              }
        }
        
        Reteno.userNotificationService.didReceiveNotificationResponseHandler = {response in
          let userInfo = response.notification.request.content.userInfo
              if let stringKeyedUserInfo = userInfo as? [String: Any] {
                  EventDispatcher.dispatchPushClicked(userInfo: stringKeyedUserInfo)
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
                  EventDispatcher.dispatchPushButtonClicked(data: actionData)
              }
        }
    }
  
  @objc public protocol RetenoEvents: AnyObject {
      func onPushReceived(userInfo: [String: Any])
      func onPushClicked(userInfo: [String: Any])
      func onPushButtonClicked(data: [String: Any])
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
    
  @objc func getInitialNotification(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
      UNUserNotificationCenter.current().getDeliveredNotifications { notifications in
          if let firstNotification = notifications.first {
              resolve(firstNotification.request.content.userInfo)
          } else {
              resolve(nil)
          }
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
                    if let url = linkInfo.url {
                                        UIApplication.shared.open(url)
                                    }
                }
            case .inAppIsClosed(let action):
                self.sendEvent(withName: "reteno-after-in-app-close", body: ["action": action])
            case .inAppReceivedError(let error):
                self.sendEvent(withName: "reteno-on-in-app-error", body: ["error": error])
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
                self.sendEvent(withName: "reteno-unread-messages-count", body: ["count": count])
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
}

//import Foundation
//import UserNotifications
//import Reteno
//import React
//
//@objc(RetenoSdk)
//public class RetenoSdk: NSObject {
//  private let eventDispatcher: RCTEventDispatcherProtocol
//  private var initialNotification: [String: Any]?
//      
//    @objc
//      init(eventDispatcher: RCTEventDispatcherProtocol) {
//          self.eventDispatcher = eventDispatcher
//          super.init()
//          setupRetenoCallbacks()
//      }
//    
//  private func setupRetenoCallbacks() {
//          Reteno.userNotificationService.didReceiveNotificationUserInfo = { [weak self] userInfo in
//              self?.sendEvent(name: "reteno-push-received", body: userInfo)
//          }
//
//          Reteno.userNotificationService.didReceiveNotificationResponseHandler = { [weak self] response in
//              self?.sendEvent(name: "reteno-push-clicked", body: response.notification.request.content.userInfo)
//          }
//
//          Reteno.userNotificationService.notificationActionHandler = { [weak self] userInfo, action in
//              let actionId = action.actionId
//              let customData = action.customData
//              let actionLink = action.link
//              self?.sendEvent(
//                  name: "reteno-push-button-clicked",
//                  body: [
//                      "userInfo": userInfo,
//                      "actionId": actionId,
//                      "customData": customData as Any,
//                      "actionLink": actionLink as Any
//                  ]
//              )
//          }
//      }
//  
//  private func sendEvent(name: String, body: Any?) {
//    let event = RCTComponentEvent(name: name, viewTag: NSNumber(value: 0), body: body as! [AnyHashable : Any])
//    eventDispatcher.send(event)
//  }
//    
//    /// Base overide for RCTEventEmitter.
//    ///
//    /// - Returns: all supported events
//  @objc public func supportedEvents() -> [String] {
//        return ["reteno-push-received", "reteno-in-app-custom-data-received", "reteno-before-in-app-display", "reteno-on-in-app-display", "reteno-before-in-app-close", "reteno-after-in-app-close", "reteno-on-in-app-error", "reteno-push-clicked", "reteno-unread-messages-count", "reteno-push-button-clicked"];
//    }
//    
//  @objc public func setDeviceToken(_ deviceToken: String) {
//    Reteno.userNotificationService.processRemoteNotificationsToken(deviceToken)
//  }
//    
//  @objc public func setUserAttributes(payload: NSDictionary) async throws {
//      do {
//          let externalUserId = payload["externalUserId"] as? String
//          let requestPayload = try RetenoUserAttributes.buildSetUserAttributesPayload(payload: payload)
//          
//        return try await withCheckedThrowingContinuation { continuation in
//                    Reteno.updateUserAttributes(
//                        externalUserId: externalUserId,
//                        userAttributes: requestPayload.userAttributes,
//                        subscriptionKeys: requestPayload.subscriptionKeys,
//                        groupNamesInclude: requestPayload.groupNamesInclude,
//                        groupNamesExclude: requestPayload.groupNamesExclude
//                    )
//                    
//                    continuation.resume()
//                }
//      } catch {
//          throw NSError(domain: "Reteno iOS SDK setUserAttributes Error", code: 100, userInfo: [NSLocalizedDescriptionKey: error.localizedDescription])
//      }
//  }
//    
//  @objc public func getInitialNotification() -> [String: Any]? {
//          guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return nil }
//          return appDelegate.initialNotification
//      }
//    
//  @objc public func registerForRemoteNotifications() async throws -> Bool {
//      return try await withCheckedThrowingContinuation { continuation in
//          Task { @MainActor in
//              Reteno.userNotificationService.registerForRemoteNotifications(
//                  with: [.sound, .alert, .badge],
//                  application: UIApplication.shared
//              ) { success in
//                  if success {
//                      continuation.resume(returning: true)
//                  } else {
//                      continuation.resume(throwing: NSError(domain: "RetenoSDK", code: 102, userInfo: [NSLocalizedDescriptionKey: "Failed to register for remote notifications"]))
//                  }
//              }
//          }
//      }
//  }
//    
//  @objc
//  public func setAnonymousUserAttributes(payload: NSDictionary) async throws {
//      do {
//          let anonymousUser = try RetenoUserAttributes.buildSetAnonymousUserAttributesPayload(payload: payload)
//          return try await withCheckedThrowingContinuation { continuation in
//              Reteno.updateAnonymousUserAttributes(userAttributes: anonymousUser)
//              continuation.resume()
//          }
//      } catch {
//          throw NSError(
//              domain: "Reteno iOS SDK setAnonymousUserAttributes Error",
//              code: 100,
//              userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]
//          )
//      }
//  }
//    
//  @objc
//  public func pauseInAppMessages(isPaused: Bool) async throws {
//      return try await withCheckedThrowingContinuation { continuation in
//          Reteno.pauseInAppMessages(isPaused: isPaused)
//          continuation.resume()
//      }
//  }
//    
//  @objc
//  public func setInAppLifecycleCallback() async throws {
//      return try await withCheckedThrowingContinuation { continuation in
//          Reteno.addInAppStatusHandler { [weak self] inAppMessageStatus in
//              guard let self = self else { return }
//              
//              switch inAppMessageStatus {
//              case .inAppShouldBeDisplayed:
//                  self.sendEvent(withName: "reteno-before-in-app-display", body: nil)
//                  
//              case .inAppIsDisplayed:
//                  self.sendEvent(withName: "reteno-on-in-app-display", body: nil)
//                  
//              case .inAppShouldBeClosed(let action):
//                  self.sendEvent(withName: "reteno-before-in-app-close", body: ["action": action])
//                  Reteno.addLinkHandler { linkInfo in
//                      self.sendEvent(withName: "reteno-in-app-custom-data-received", body: ["customData": linkInfo.customData])
//                      if let url = linkInfo.url {
//                          Task { @MainActor in
//                              UIApplication.shared.open(url)
//                          }
//                      }
//                  }
//                  
//              case .inAppIsClosed(let action):
//                  self.sendEvent(withName: "reteno-after-in-app-close", body: ["action": action])
//                  
//              case .inAppReceivedError(let error):
//                  self.sendEvent(withName: "reteno-on-in-app-error", body: ["error": error])
//              }
//          }
//          continuation.resume()
//      }
//  }
//  
//  @objc
//  public func getRecommendations(payload: NSDictionary) async throws -> [[String: Any]] {
//      guard let recomVariantId = payload["recomVariantId"] as? String,
//            let productIds = payload["productIds"] as? [String],
//            let categoryId = payload["categoryId"] as? String,
//            let filters = payload["filters"] as? [[String: Any]],
//            let fields = payload["fields"] as? [String] else {
//          throw NSError(domain: "RetenoSdk", code: 100, userInfo: [NSLocalizedDescriptionKey: "Invalid payload"])
//      }
//
//      let recomFilters: [RecomFilter]? = filters.compactMap { dict in
//          guard let name = dict["name"] as? String, let values = dict["values"] as? [String] else {
//              return nil
//          }
//          return RecomFilter(name: name, values: values)
//      }
//
//      return try await withCheckedThrowingContinuation { continuation in
//          Reteno.recommendations().getRecoms(
//              recomVariantId: recomVariantId,
//              productIds: productIds,
//              categoryId: categoryId,
//              filters: recomFilters,
//              fields: fields
//          ) { (result: Result<[Recommendation], Error>) in
//              switch result {
//              case .success(let recommendations):
//                  let serializedRecommendations = recommendations.map { recommendation in
//                      return [
//                          "productId": recommendation.productId,
//                          "name": recommendation.name,
//                          "description": recommendation.description ?? "",
//                          "imageUrl": recommendation.imageUrl?.absoluteString ?? "",
//                          "price": recommendation.price
//                      ]
//                  }
//                  continuation.resume(returning: serializedRecommendations)
//                  
//              case .failure(let error):
//                  continuation.resume(throwing: error)
//              }
//          }
//      }
//  }
//   
//  @objc
//  public func logRecommendationEvent(payload: NSDictionary) async throws {
//      guard let recomVariantId = payload["recomVariantId"] as? String,
//            let impressions = payload["impressions"] as? [[String: Any]],
//            let clicks = payload["clicks"] as? [[String: Any]],
//            let forcePush = payload["forcePush"] as? Bool else {
//          throw NSError(domain: "InvalidPayload", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid payload"])
//      }
//      
//      let impressionEvents: [RecomEvent] = impressions.compactMap { impression in
//          let productId = impression["productId"] as? String ?? ""
//          return RecomEvent(date: Date(), productId: productId)
//      }
//      
//      let clickEvents: [RecomEvent] = clicks.compactMap { click in
//          let productId = click["productId"] as? String ?? ""
//          return RecomEvent(date: Date(), productId: productId)
//      }
//      
//      return try await withCheckedThrowingContinuation { continuation in
//          Reteno.recommendations().logEvent(
//              recomVariantId: recomVariantId,
//              impressions: impressionEvents,
//              clicks: clickEvents,
//              forcePush: forcePush
//          )
//          continuation.resume()
//      }
//  }
//
//  @objc
//  public func getAppInboxMessages(payload: NSDictionary) async throws -> [String: Any] {
//      let page = payload["page"] as? Int
//      let pageSize = payload["pageSize"] as? Int
//
//      return try await withCheckedThrowingContinuation { continuation in
//          Reteno.inbox().downloadMessages(page: page, pageSize: pageSize) { result in
//              switch result {
//              case .success(let response):
//                  let messages = response.messages.map { message in
//                      return [
//                          "id": message.id,
//                          "createdDate": message.createdDate?.timeIntervalSince1970 as Any,
//                          "title": message.title as Any,
//                          "content": message.content as Any,
//                          "imageURL": message.imageURL?.absoluteString as Any,
//                          "linkURL": message.linkURL?.absoluteString as Any,
//                          "isNew": message.isNew
//                      ]
//                  }
//                  continuation.resume(returning: ["messages": messages, "totalPages": response.totalPages as Any])
//                  
//              case .failure(let error):
//                  continuation.resume(throwing: NSError(domain: "Reteno iOS SDK getAppInboxMessages Error", code: 100, userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]))
//              }
//          }
//      }
//  }
//    
//  @objc
//  public func onUnreadMessagesCountChanged() {
//      Reteno.inbox().onUnreadMessagesCountChanged = { count in
//          self.sendEvent(withName: "reteno-unread-messages-count", body: ["count": count])
//      }
//  }
//
//  @objc
//  public func markAsOpened(messageIds: [String]) async throws -> Bool {
//      return try await withCheckedThrowingContinuation { continuation in
//          Reteno.inbox().markAsOpened(messageIds: messageIds) { result in
//              switch result {
//              case .success:
//                  continuation.resume(returning: true)
//              case .failure(let error):
//                  continuation.resume(throwing: NSError(domain: "Reteno iOS SDK markAsOpened Error", code: 100, userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]))
//              }
//          }
//      }
//  }
//
//  @objc
//  public func markAllAsOpened() async throws -> Bool {
//      return try await withCheckedThrowingContinuation { continuation in
//          Reteno.inbox().markAllAsOpened { result in
//              switch result {
//              case .success:
//                  continuation.resume(returning: true)
//              case .failure(let error):
//                  continuation.resume(throwing: NSError(domain: "Reteno iOS SDK markAllAsOpened Error", code: 100, userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]))
//              }
//          }
//      }
//  }
//
//  @objc
//  public func getAppInboxMessagesCount() async throws -> Int {
//      return try await withCheckedThrowingContinuation { continuation in
//          Reteno.inbox().getUnreadMessagesCount { result in
//              switch result {
//              case .success(let unreadCount):
//                  continuation.resume(returning: unreadCount)
//              case .failure(let error):
//                  continuation.resume(throwing: NSError(domain: "Reteno iOS SDK getAppInboxMessagesCount Error", code: 100, userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]))
//              }
//          }
//      }
//  }
//}
