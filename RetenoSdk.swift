import Foundation
import UserNotifications
import Reteno

@objc(RetenoSdk)
public class RetenoSdk: NSObject {
    private var eventEmitter: EventEmitter

    override init() {
        eventEmitter = EventEmitter.sharedInstance
        super.init()
        eventEmitter.registerEventEmitter(externalEventEmitter: self)
        
        Reteno.userNotificationService.didReceiveNotificationUserInfo = { userInfo in
            EventEmitter.sharedInstance.dispatch(name: "reteno-push-received", body: userInfo)
        }
        
        Reteno.userNotificationService.didReceiveNotificationResponseHandler = { response in
            EventEmitter.sharedInstance.dispatch(name: "reteno-push-clicked", body: response.notification.request.content.userInfo)
        }
        
        Reteno.userNotificationService.notificationActionHandler = { userInfo, action in
            let actionId = action.actionId
            let customData = action.customData
            let actionLink = action.link
            EventEmitter.sharedInstance.dispatch(name: "reteno-push-button-clicked", body: [
                "userInfo": userInfo,
                "actionId": actionId,
                "customData": customData as Any,
                "actionLink": actionLink as Any
            ])
        }
    }

    // MARK: - TurboModule Methods

    @objc public func setDeviceToken(_ deviceToken: String) {
        Reteno.userNotificationService.processRemoteNotificationsToken(deviceToken)
    }

    @objc public func setUserAttributes(_ payload: NSDictionary, resolver: @escaping (Any) -> Void, rejecter: @escaping (String, String, Error?) -> Void) {
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
            resolver(["success": true])
        } catch {
            rejecter("100", "Reteno iOS SDK Error", error)
        }
    }

  @objc public func getInitialNotification(_ resolver: @escaping (Any) -> Void, rejecter: @escaping (String, String, Error?) -> Void) async {
        // Note: `bridge.launchOptions` is not available in TurboModules; you'll need to pass this via initialization or another method
    let remoteUserInfo = await (UIApplication.shared.delegate?.application)(UIApplication.shared, nil)![UIApplication.LaunchOptionsKey.remoteNotification]
        resolver(remoteUserInfo ?? NSNull())
    }

    @objc public func logEvent(_ payload: NSDictionary, resolver: @escaping (Any) -> Void, rejecter: @escaping (String, String, Error?) -> Void) {
        do {
            let requestPayload = try RetenoEvent.buildEventPayload(payload: payload)
            Reteno.logEvent(
                eventTypeKey: requestPayload.eventName,
                date: requestPayload.date,
                parameters: requestPayload.parameters,
                forcePush: requestPayload.forcePush
            )
            resolver(["success": true])
        } catch {
            rejecter("100", "Reteno iOS SDK Error", error)
        }
    }

    @objc public func registerForRemoteNotifications() {
        Reteno.userNotificationService.registerForRemoteNotifications(with: [.sound, .alert, .badge], application: UIApplication.shared)
    }

    @objc public func setAnonymousUserAttributes(_ payload: NSDictionary, resolver: @escaping (Any) -> Void, rejecter: @escaping (String, String, Error?) -> Void) {
        do {
            let anonymousUser = try RetenoUserAttributes.buildSetAnonymousUserAttributesPayload(payload: payload)
            Reteno.updateAnonymousUserAttributes(userAttributes: anonymousUser)
            resolver(true)
        } catch {
            rejecter("100", "Reteno iOS SDK setAnonymousUserAttributes Error", error)
        }
    }

    @objc public func pauseInAppMessages(_ isPaused: Bool, resolver: @escaping (Any) -> Void, rejecter: @escaping (String, String, Error?) -> Void) {
        Reteno.pauseInAppMessages(isPaused: isPaused)
        resolver(true)
    }

    @objc public func setInAppLifecycleCallback() {
        Reteno.addInAppStatusHandler { [weak self] inAppMessageStatus in
            guard let self = self else { return }
            switch inAppMessageStatus {
            case .inAppShouldBeDisplayed:
                self.eventEmitter.dispatch(name: "reteno-before-in-app-display", body: nil)
            case .inAppIsDisplayed:
                self.eventEmitter.dispatch(name: "reteno-on-in-app-display", body: nil)
            case .inAppShouldBeClosed(let action):
                self.eventEmitter.dispatch(name: "reteno-before-in-app-close", body: ["action": action])
                Reteno.addLinkHandler { linkInfo in
                    self.eventEmitter.dispatch(name: "reteno-in-app-custom-data-received", body: ["customData": linkInfo.customData])
                    if let url = linkInfo.url {
                        UIApplication.shared.open(url)
                    }
                }
            case .inAppIsClosed(let action):
                self.eventEmitter.dispatch(name: "reteno-after-in-app-close", body: ["action": action])
            case .inAppReceivedError(let error):
                self.eventEmitter.dispatch(name: "reteno-on-in-app-error", body: ["error": error])
            }
        }
    }

    @objc public func getRecommendations(_ payload: NSDictionary, resolver: @escaping (Any) -> Void, rejecter: @escaping (String, String, Error?) -> Void) {
        guard let recomVariantId = payload["recomVariantId"] as? String,
              let productIds = payload["productIds"] as? [String],
              let categoryId = payload["categoryId"] as? String,
              let filters = payload["filters"] as? [NSDictionary],
              let fields = payload["fields"] as? [String] else {
            let error = NSError(domain: "RetenoSdk", code: 100, userInfo: [NSLocalizedDescriptionKey: "Invalid payload"])
            rejecter("100", "Reteno iOS SDK Error: Invalid payload", error)
            return
        }

        var recomFilters: [RecomFilter]? = filters.compactMap { dict in
            guard let name = dict["name"] as? String, let values = dict["values"] as? [String] else { return nil }
            return RecomFilter(name: name, values: values)
        }

        Reteno.recommendations().getRecoms(recomVariantId: recomVariantId, productIds: productIds, categoryId: categoryId, filters: recomFilters, fields: fields) { result in
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
                resolver(serializedRecommendations)
            case .failure(let error):
                rejecter("100", "Reteno iOS SDK getRecommendations Error", error)
            }
        }
    }

    @objc public func logRecommendationEvent(_ payload: NSDictionary, resolver: @escaping (Any) -> Void, rejecter: @escaping (String, String, Error?) -> Void) {
        guard let recomVariantId = payload["recomVariantId"] as? String,
              let impressions = payload["impressions"] as? [[String: Any]],
              let clicks = payload["clicks"] as? [[String: Any]],
              let forcePush = payload["forcePush"] as? Bool else {
            let error = NSError(domain: "InvalidPayload", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid payload"])
            rejecter("100", "Reteno iOS SDK logRecommendationEvent Error", error)
            return
        }

        let impressionEvents = impressions.map { impression in
            let productId = impression["productId"] as? String ?? ""
            return RecomEvent(date: Date(), productId: productId)
        }

        let clickEvents = clicks.map { click in
            let productId = click["productId"] as? String ?? ""
            return RecomEvent(date: Date(), productId: productId)
        }

        Reteno.recommendations().logEvent(recomVariantId: recomVariantId, impressions: impressionEvents, clicks: clickEvents, forcePush: forcePush)
        resolver(["success": true])
    }

    @objc public func getAppInboxMessages(_ payload: NSDictionary, resolver: @escaping (Any) -> Void, rejecter: @escaping (String, String, Error?) -> Void) {
        let page = payload["page"] as? Int
        let pageSize = payload["pageSize"] as? Int
        let statusString = payload["status"] as? String

        let status: AppInboxMessagesStatus? = {
            switch statusString?.uppercased() {
            case "OPENED": return .opened
            case "UNOPENED": return .unopened
            default: return nil
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
                        "isNew": message.isNew
                    ]
                }
                resolver(["messages": messages, "totalPages": response.totalPages as Any])
            case .failure(let error):
                rejecter("100", "Reteno iOS SDK downloadMessages Error", error)
            }
        }
    }

    @objc public func onUnreadMessagesCountChanged() {
        Reteno.inbox().onUnreadMessagesCountChanged = { [weak self] count in
            self?.eventEmitter.dispatch(name: "reteno-unread-messages-count", body: ["count": count])
        }
    }

    @objc public func markAsOpened(_ messageIds: [String], resolver: @escaping (Any) -> Void, rejecter: @escaping (String, String, Error?) -> Void) {
        Reteno.inbox().markAsOpened(messageIds: messageIds) { result in
            switch result {
            case .success:
                resolver(true)
            case .failure(let error):
                rejecter("100", "Reteno iOS SDK markAsOpened Error", error)
            }
        }
    }

    @objc public func markAllAsOpened(_ resolver: @escaping (Any) -> Void, rejecter: @escaping (String, String, Error?) -> Void) {
        Reteno.inbox().markAllAsOpened { result in
            switch result {
            case .success:
                resolver(true)
            case .failure(let error):
                rejecter("100", "Reteno iOS SDK markAllAsOpened Error", error)
            }
        }
    }

    @objc public func getAppInboxMessagesCount(_ resolver: @escaping (Any) -> Void, rejecter: @escaping (String, String, Error?) -> Void) {
        Reteno.inbox().getUnreadMessagesCount { result in
            switch result {
            case .success(let unreadCount):
                resolver(unreadCount)
            case .failure(let error):
                rejecter("100", "Reteno iOS SDK getAppInboxMessagesCount Error", error)
            }
        }
    }
}

// Assuming EventEmitter is a separate Swift class for managing events
class EventEmitter {
    static let sharedInstance = EventEmitter()
    private var externalEmitter: RetenoSdk?

    func registerEventEmitter(externalEventEmitter: RetenoSdk) {
        externalEmitter = externalEventEmitter
    }

    func dispatch(name: String, body: Any?) {
        // This would need to integrate with TurboModule's event system, e.g., via a delegate or JSI
        // For now, we'll assume it’s handled externally
    }

    var allEvents: [String] {
        return [
            "reteno-push-received",
            "reteno-push-clicked",
            "reteno-push-button-clicked",
            "reteno-before-in-app-display",
            "reteno-on-in-app-display",
            "reteno-before-in-app-close",
            "reteno-in-app-custom-data-received",
            "reteno-after-in-app-close",
            "reteno-on-in-app-error",
            "reteno-unread-messages-count"
        ]
    }
}
