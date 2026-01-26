class EventEmitter {

    /// Shared Instance.
    public static var sharedInstance = EventEmitter()

    // ReactNativeEventEmitter is instantiated by React Native with the bridge.
    private var eventEmitter: RetenoSdk!

    // Event queue for buffering events before initialization
    private var eventQueue: [(name: String, body: Any?)] = []
    private var isInitialized: Bool = false
    private let queueLock = NSLock()
    private let maxQueueSize: Int = 100

    private init() {}

    // When React Native instantiates the emitter it is registered here.
    func registerEventEmitter(externalEventEmitter: RetenoSdk) {
        eventEmitter = externalEventEmitter
    }

    func dispatch(name: String, body: Any?) {
        queueLock.lock()
        defer { queueLock.unlock() }

        if isInitialized {
            eventEmitter.sendEvent(withName: name, body: body)
        } else {
            // Queue the event if not initialized
            if eventQueue.count >= maxQueueSize {
                eventQueue.removeFirst()
            }
            eventQueue.append((name: name, body: body))
        }
    }

    /// Called from JS to signal initialization is complete. Flushes all queued events.
    func setInitialized() {
        queueLock.lock()
        defer { queueLock.unlock() }

        guard !isInitialized else { return }

        isInitialized = true

        // Flush queued events
        for event in eventQueue {
            eventEmitter.sendEvent(withName: event.name, body: event.body)
        }
        eventQueue.removeAll()
    }

    /// All Events which must be support by React Native.
    lazy var allEvents: [String] = {
        var allEventNames: [String] = ["reteno-push-received", "reteno-in-app-custom-data-received", "reteno-before-in-app-display", "reteno-on-in-app-display", "reteno-before-in-app-close", "reteno-after-in-app-close", "reteno-on-in-app-error", "reteno-push-clicked", "reteno-unread-messages-count", "reteno-push-button-clicked"]

        // Append all events here

        return allEventNames
    }()

}
