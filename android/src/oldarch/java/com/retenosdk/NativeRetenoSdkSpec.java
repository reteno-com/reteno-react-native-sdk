package com.retenosdk;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

abstract class NativeRetenoSdkSpec extends ReactContextBaseJavaModule {
  NativeRetenoSdkSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }
}
