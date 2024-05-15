class EventEmitter {

    /// Shared Instance.
    public static var sharedInstance = EventEmitter()

    // ReactNativeEventEmitter is instantiated by React Native with the bridge.
    private var eventEmitter: RetenoSdk!

    private init() {}

    // When React Native instantiates the emitter it is registered here.
    func registerEventEmitter(externalEventEmitter: RetenoSdk) {
        eventEmitter = externalEventEmitter
    }

    func dispatch(name: String, body: Any?) {
        eventEmitter.sendEvent(withName: name, body: body)
    }

    /// All Events which must be support by React Native.
    lazy var allEvents: [String] = {
        var allEventNames: [String] = ["reteno-push-received", "reteno-in-app-custom-data-received", "reteno-before-in-app-display", "reteno-on-in-app-display", "reteno-before-in-app-close", "reteno-after-in-app-close", "reteno-on-in-app-error", "reteno-push-clicked"]

        // Append all events here
        
        return allEventNames
    }()

}
