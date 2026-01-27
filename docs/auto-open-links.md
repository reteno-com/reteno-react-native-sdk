# Controlling Auto-Open Links

By default, the Reteno SDK automatically opens URLs in the browser when a user clicks on push notifications or in-app messages that contain links. You can disable this behavior and handle URLs manually.

## API Methods

| Method | Description |
|--------|-------------|
| `setAutoOpenLinks(enabled: boolean)` | Enable or disable automatic URL opening. Default: `true` |
| `getAutoOpenLinks()` | Get current setting. Returns `Promise<boolean>` |

## Native Setup Required

To support controlling auto-open links on **cold start** (when app is killed from memory), you need to add code to your native AppDelegate/MainApplication.

---

## iOS Setup

Add the following code to your `AppDelegate.swift` **BEFORE** calling `Reteno.start()`:

```swift
import Reteno

@main
class AppDelegate: RCTAppDelegate {

  // Add this property to read auto-open setting from UserDefaults
  private static let autoOpenLinksKey = "RetenoAutoOpenLinks"

  private static var autoOpenLinks: Bool {
    if UserDefaults.standard.object(forKey: autoOpenLinksKey) == nil {
      return true // default: auto-open enabled
    }
    return UserDefaults.standard.bool(forKey: autoOpenLinksKey)
  }

  override func application(_ application: UIApplication,
      didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {

        // IMPORTANT: Set link handler BEFORE Reteno.start() to intercept links on cold start
        Reteno.addLinkHandler { linkInfo in
          // Dispatch event to React Native via NotificationCenter
          NotificationCenter.default.post(
            name: NSNotification.Name("RetenoLinkReceived"),
            object: nil,
            userInfo: [
              "customData": linkInfo.customData,
              "url": linkInfo.url?.absoluteString as Any
            ]
          )

          // Open URL only if autoOpenLinks is enabled
          if AppDelegate.autoOpenLinks, let url = linkInfo.url {
            UIApplication.shared.open(url)
          }
        }

        // Initialize Reteno SDK AFTER setting the link handler
        Reteno.start(apiKey: "YOUR_API_KEY", isDebugMode: false)

        // ... rest of your setup
  }
}
```

---

## Android Setup

Android works out of the box - no additional native setup required. The SDK reads the setting from SharedPreferences.

---

## Usage in React Native

```typescript
import {
  setAutoOpenLinks,
  getAutoOpenLinks,
  addInAppMessageCustomDataHandler,
  setOnRetenoPushClickedListener,
  initializeEventHandler,
} from 'reteno-react-native-sdk';

useEffect(() => {
  // Disable automatic URL opening
  setAutoOpenLinks(false);

  // Handle URLs manually from in-app messages
  const inAppListener = addInAppMessageCustomDataHandler((data) => {
    console.log('In-app message data:', data);
    if (data.url) {
      // Custom URL handling - e.g., open in WebView, deep link, etc.
      navigation.navigate('WebView', { url: data.url });
    }
  });

  // Handle URLs manually from push notifications
  const pushListener = setOnRetenoPushClickedListener((event) => {
    console.log('Push clicked:', event);
    // Handle push notification click
  });

  // Initialize event handler to start receiving events
  initializeEventHandler();

  return () => {
    inAppListener?.remove();
    pushListener?.remove();
  };
}, []);
```

### Reading Current Setting

```typescript
// Get current auto-open links setting
const isEnabled = await getAutoOpenLinks();
console.log('Auto open links:', isEnabled ? 'ON' : 'OFF');
```

### Syncing UI State on App Start

If you have a toggle in your UI, sync it with the native setting on app start:

```typescript
const [autoOpenLinksEnabled, setAutoOpenLinksEnabled] = useState(true);

useEffect(() => {
  // Sync UI state with native storage
  getAutoOpenLinks().then(setAutoOpenLinksEnabled);
}, []);
```

---

## How It Works

### Why Native Setup is Required for iOS

When your app is **killed from memory** (cold start) and the user taps a push notification with a URL:

1. `AppDelegate.didFinishLaunchingWithOptions()` is called
2. `Reteno.start()` initializes the SDK
3. The SDK processes the push notification and calls the link handler
4. React Native is not yet initialized at this point

If the link handler is not set **before** `Reteno.start()`, the native SDK will use its default behavior and open the URL in the browser.

By setting `Reteno.addLinkHandler` in AppDelegate before `Reteno.start()`, we intercept all links and can control whether to open them based on the `autoOpenLinks` setting stored in UserDefaults.

### Android

On Android, the `RetenoCustomReceiverInAppData` broadcast receiver checks `SharedPreferences` before opening URLs, so it works without additional native setup.

---

## Event Data Format

When you receive a link event via `addInAppMessageCustomDataHandler`, the data has this structure:

```typescript
type InAppCustomData = {
  customData?: Record<string, any>;  // Custom data from the message
  url?: string;                       // The URL that was clicked
  inapp_id?: string;                  // In-app message ID (Android)
  inapp_source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';  // Source (Android)
};
```
