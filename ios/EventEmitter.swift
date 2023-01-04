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
        var allEventNames: [String] = ["reteno-push-received"]

        // Append all events here
        
        return allEventNames
    }()

}
