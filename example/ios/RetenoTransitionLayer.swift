import Foundation
import Reteno

@objc public class RetenoTransitionLayer: NSObject {
  @objc class func setup(forApplication application: UIApplication) {
    Reteno.start(apiKey: "SDK_ACCESS_KEY");
    // Register for receiving push notifications
    // registerForRemoteNotifications will show the native iOS notification permission prompt
    // Provide UNAuthorizationOptions or use default
    Reteno.userNotificationService.registerForRemoteNotifications(with: [.sound, .alert, .badge], application: application);
    
//    Reteno.userNotificationService.didReceiveNotificationUserInfo = {userInfo in
//      print("Received user info from push: \n--------\n\(userInfo)");
//    }
    
    Reteno.userNotificationService.willPresentNotificationHandler = { notification in
      // The closure will be called only if the application is in the foreground.
      // You can choose to have the notification presented as a sound, badge, alert and/or in the notification list.
      // This decision should be based on whether the information in the notification is otherwise visible to the user.
      
      let authOptions: UNNotificationPresentationOptions
      if #available(iOS 14.0, *) {
        authOptions = [.badge, .sound, .banner]
      } else {
        authOptions = [.badge, .sound, .alert]
      }
      return authOptions
    }
    
    Reteno.userNotificationService.didReceiveNotificationResponseHandler = { notification in
      // Add your code here.
      // The closure will be called when the user responded to the notification by opening the application,
      // dismissing the notification or choosing a UNNotificationAction.
    }
  }
  
  @objc class func processRemoteNotificationsToken(withDeviceToken token: Data) {
    let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined();
    Reteno.userNotificationService.processRemoteNotificationsToken(tokenString);
  }
  
  @objc class func processRemoteNotificationsToken(withFCMToken fcmToken: String?) {
    guard let fcmToken = fcmToken else { return }
    Reteno.userNotificationService.processRemoteNotificationsToken(fcmToken);
  }
}
