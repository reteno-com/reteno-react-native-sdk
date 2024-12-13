import Foundation
import UserNotifications
import Reteno
import React

@objc(RetenoSdk)
class RetenoSdk: RCTEventEmitter {
  override static func moduleName() -> String! {
        return "RetenoSdk"
    }

  override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override init() {
        super.init()
        
      Reteno.userNotificationService.didReceiveNotificationUserInfo = { [weak self] userInfo in
              self?.sendEvent(withName: "reteno-push-received", body: userInfo)
          }
          
          Reteno.userNotificationService.didReceiveNotificationResponseHandler = { [weak self] response in
              self?.sendEvent(withName: "reteno-push-clicked", body: response.notification.request.content.userInfo)
          }
          
          Reteno.userNotificationService.notificationActionHandler = { [weak self] userInfo, action in
              let actionId = action.actionId
              let customData = action.customData
              let actionLink = action.link
              self?.sendEvent(withName: "reteno-push-button-clicked", body: ["userInfo": userInfo, "actionId": actionId, "customData": customData as Any, "actionLink": actionLink as Any])
          }
    }
    
    /// Base overide for RCTEventEmitter.
    ///
    /// - Returns: all supported events
  @objc override func supportedEvents() -> [String] {
        return ["reteno-push-received", "reteno-in-app-custom-data-received", "reteno-before-in-app-display", "reteno-on-in-app-display", "reteno-before-in-app-close", "reteno-after-in-app-close", "reteno-on-in-app-error", "reteno-push-clicked", "reteno-unread-messages-count", "reteno-push-button-clicked"];
    }
    
  @objc
  func setDeviceToken(deviceToken: String) async {
    await withCheckedContinuation { continuation in
        Reteno.userNotificationService.processRemoteNotificationsToken(deviceToken)
        continuation.resume()
    }
  }
    
  @objc
  func setUserAttributes(payload: NSDictionary) async throws {
      do {
          let externalUserId = payload["externalUserId"] as? String
          let requestPayload = try RetenoUserAttributes.buildSetUserAttributesPayload(payload: payload)
          
        return try await withCheckedThrowingContinuation { continuation in
                    Reteno.updateUserAttributes(
                        externalUserId: externalUserId,
                        userAttributes: requestPayload.userAttributes,
                        subscriptionKeys: requestPayload.subscriptionKeys,
                        groupNamesInclude: requestPayload.groupNamesInclude,
                        groupNamesExclude: requestPayload.groupNamesExclude
                    )
                    
                    continuation.resume()
                }
      } catch {
          throw NSError(domain: "Reteno iOS SDK setUserAttributes Error", code: 100, userInfo: [NSLocalizedDescriptionKey: error.localizedDescription])
      }
  }
    
  @objc
  func getInitialNotification() async -> Any? {
      if let remoteUserInfo = bridge.launchOptions?[UIApplication.LaunchOptionsKey.remoteNotification] {
          return remoteUserInfo
      }
      return nil
  }
    
  @objc
  func logEvent(payload: NSDictionary) async throws {
      do {
          let requestPayload = try RetenoEvent.buildEventPayload(payload: payload)
          
        return try await withCheckedThrowingContinuation { continuation in
                Reteno.logEvent(
                    eventTypeKey: requestPayload.eventName,
                    date: requestPayload.date,
                    parameters: requestPayload.parameters,
                    forcePush: requestPayload.forcePush
                )
                continuation.resume()
            }
      } catch {
          throw NSError(domain: "Reteno iOS SDK logEvent Error", code: 100, userInfo: [NSLocalizedDescriptionKey: error.localizedDescription])
      }
  }
    
  @objc
  @MainActor
  func registerForRemoteNotifications() async throws -> Bool {
      return try await withCheckedThrowingContinuation { continuation in
          Reteno.userNotificationService.registerForRemoteNotifications(
              with: [.sound, .alert, .badge],
              application: UIApplication.shared
          )
          continuation.resume(returning: true)
      }
  }
    
  @objc
  func setAnonymousUserAttributes(payload: NSDictionary) async throws {
      do {
          let anonymousUser = try RetenoUserAttributes.buildSetAnonymousUserAttributesPayload(payload: payload)
          return try await withCheckedThrowingContinuation { continuation in
              Reteno.updateAnonymousUserAttributes(userAttributes: anonymousUser)
              continuation.resume()
          }
      } catch {
          throw NSError(
              domain: "Reteno iOS SDK setAnonymousUserAttributes Error",
              code: 100,
              userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]
          )
      }
  }
    
  @objc
  func pauseInAppMessages(isPaused: Bool) async throws {
      return try await withCheckedThrowingContinuation { continuation in
          Reteno.pauseInAppMessages(isPaused: isPaused)
          continuation.resume()
      }
  }
    
  @objc
  func setInAppLifecycleCallback() async throws {
      return try await withCheckedThrowingContinuation { continuation in
          Reteno.addInAppStatusHandler { [weak self] inAppMessageStatus in
              guard let self = self else { return }
              
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
                          Task { @MainActor in
                              UIApplication.shared.open(url)
                          }
                      }
                  }
                  
              case .inAppIsClosed(let action):
                  self.sendEvent(withName: "reteno-after-in-app-close", body: ["action": action])
                  
              case .inAppReceivedError(let error):
                  self.sendEvent(withName: "reteno-on-in-app-error", body: ["error": error])
              }
          }
          continuation.resume()
      }
  }
  
  @objc
  func getRecommendations(payload: NSDictionary) async throws -> [[String: Any]] {
      guard let recomVariantId = payload["recomVariantId"] as? String,
            let productIds = payload["productIds"] as? [String],
            let categoryId = payload["categoryId"] as? String,
            let filters = payload["filters"] as? [[String: Any]],
            let fields = payload["fields"] as? [String] else {
          throw NSError(domain: "RetenoSdk", code: 100, userInfo: [NSLocalizedDescriptionKey: "Invalid payload"])
      }

      let recomFilters: [RecomFilter]? = filters.compactMap { dict in
          guard let name = dict["name"] as? String, let values = dict["values"] as? [String] else {
              return nil
          }
          return RecomFilter(name: name, values: values)
      }

      return try await withCheckedThrowingContinuation { continuation in
          Reteno.recommendations().getRecoms(
              recomVariantId: recomVariantId,
              productIds: productIds,
              categoryId: categoryId,
              filters: recomFilters,
              fields: fields
          ) { (result: Result<[Recommendation], Error>) in
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
                  continuation.resume(returning: serializedRecommendations)
                  
              case .failure(let error):
                  continuation.resume(throwing: error)
              }
          }
      }
  }
   
  @objc
  func logRecommendationEvent(payload: NSDictionary) async throws {
      guard let recomVariantId = payload["recomVariantId"] as? String,
            let impressions = payload["impressions"] as? [[String: Any]],
            let clicks = payload["clicks"] as? [[String: Any]],
            let forcePush = payload["forcePush"] as? Bool else {
          throw NSError(domain: "InvalidPayload", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid payload"])
      }
      
      let impressionEvents: [RecomEvent] = impressions.compactMap { impression in
          let productId = impression["productId"] as? String ?? ""
          return RecomEvent(date: Date(), productId: productId)
      }
      
      let clickEvents: [RecomEvent] = clicks.compactMap { click in
          let productId = click["productId"] as? String ?? ""
          return RecomEvent(date: Date(), productId: productId)
      }
      
      return try await withCheckedThrowingContinuation { continuation in
          Reteno.recommendations().logEvent(
              recomVariantId: recomVariantId,
              impressions: impressionEvents,
              clicks: clickEvents,
              forcePush: forcePush
          )
          continuation.resume()
      }
  }

  @objc
  func getAppInboxMessages(payload: NSDictionary) async throws -> [String: Any] {
      let page = payload["page"] as? Int
      let pageSize = payload["pageSize"] as? Int

      return try await withCheckedThrowingContinuation { continuation in
          Reteno.inbox().downloadMessages(page: page, pageSize: pageSize) { result in
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
                          "isNew": message.isNew
                      ]
                  }
                  continuation.resume(returning: ["messages": messages, "totalPages": response.totalPages as Any])
                  
              case .failure(let error):
                  continuation.resume(throwing: NSError(domain: "Reteno iOS SDK getAppInboxMessages Error", code: 100, userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]))
              }
          }
      }
  }
    
  @objc
  func onUnreadMessagesCountChanged() {
      Reteno.inbox().onUnreadMessagesCountChanged = { count in
          self.sendEvent(withName: "reteno-unread-messages-count", body: ["count": count])
      }
  }

  @objc
  func markAsOpened(messageIds: [String]) async throws -> Bool {
      return try await withCheckedThrowingContinuation { continuation in
          Reteno.inbox().markAsOpened(messageIds: messageIds) { result in
              switch result {
              case .success:
                  continuation.resume(returning: true)
              case .failure(let error):
                  continuation.resume(throwing: NSError(domain: "Reteno iOS SDK markAsOpened Error", code: 100, userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]))
              }
          }
      }
  }

  @objc
  func markAllAsOpened() async throws -> Bool {
      return try await withCheckedThrowingContinuation { continuation in
          Reteno.inbox().markAllAsOpened { result in
              switch result {
              case .success:
                  continuation.resume(returning: true)
              case .failure(let error):
                  continuation.resume(throwing: NSError(domain: "Reteno iOS SDK markAllAsOpened Error", code: 100, userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]))
              }
          }
      }
  }

  @objc
  func getAppInboxMessagesCount() async throws -> Int {
      return try await withCheckedThrowingContinuation { continuation in
          Reteno.inbox().getUnreadMessagesCount { result in
              switch result {
              case .success(let unreadCount):
                  continuation.resume(returning: unreadCount)
              case .failure(let error):
                  continuation.resume(throwing: NSError(domain: "Reteno iOS SDK getAppInboxMessagesCount Error", code: 100, userInfo: [NSLocalizedDescriptionKey: error.localizedDescription]))
              }
          }
      }
  }
}
