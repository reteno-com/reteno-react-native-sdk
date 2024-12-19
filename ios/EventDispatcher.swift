class EventDispatcher {
    static var shared: RetenoEvents?
    
    static func dispatchPushReceived(userInfo: [String: Any]) {
        shared?.onPushReceived(userInfo: userInfo)
    }
    
    static func dispatchPushClicked(userInfo: [String: Any]) {
        shared?.onPushClicked(userInfo: userInfo)
    }
    
    static func dispatchPushButtonClicked(data: [String: Any]) {
        shared?.onPushButtonClicked(data: data)
    }
}
