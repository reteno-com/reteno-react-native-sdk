# React Native SDK Setup

### The Reteno React Native SDK for Mobile Customer Engagement and Analytics solutions

## Overview

`Reteno` is a lightweight SDK for React Native that helps mobile teams integrate Reteno into their mobile apps. The server-side library makes it easy to call the `Reteno API`.

##### The SDK supports:

- React Native 0.65 or later — including the **New Architecture** (Fabric/TurboModules). Starting with `v3.0.0` the native module ships a codegen `Spec` (`RetenoSdkSpec`) and conforms to `TurboModule` on both platforms; apps still on the old (bridge) architecture keep working unchanged, autodetected at build time — there is nothing to configure either way
- iOS 14.0 or later — this is the deployment target required by the `reteno-react-native-sdk` podspec. The bundled native `Reteno` 2.7.4 pod itself supports iOS 12.0 or later
- Android 8.0 or later (API 26) — SDK functionality is unavailable below this level. The artifacts declare `minSdkVersion 21`, so integrating Reteno does not force you to raise your own `minSdkVersion`; the SDK is simply inactive on older devices — see [Android setup](./Android.md#requirements)

##### Native SDK versions in `reteno-react-native-sdk` `v3.0.1`:

- Reteno Android SDK 2.10.2
- Reteno iOS SDK 2.7.4

## Getting started with Reteno SDK / Setup guide


- [iOS](./IOS.md)
- [Android](./Android.md)
​
## API style

Every SDK method is available as a flat, top-level export (`setUserAttributes`, `setOnRetenoPushReceivedListener`, …) — this remains the canonical form and is not deprecated. Starting with `v3.0.0` the same methods are also grouped into namespaced objects (`user`, `push`, `events`, `inApp`, `inbox`, `recommendations`, `ecommerce`) for teams that prefer that style. See [Namespaced API](../NamespacedAPI/README.md) for the full mapping and usage.

##### Licence

Reteno React Native SDK is released under the MIT license. See [LICENSE](https://github.com/reteno-com/reteno-mobile-react-native-sdk/blob/main/LICENSE) for details.
