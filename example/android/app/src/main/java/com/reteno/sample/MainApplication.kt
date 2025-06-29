package com.reteno.sample

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.reteno.core.Reteno
import com.reteno.core.RetenoConfig
import com.reteno.core.RetenoImpl
import com.retenosdk.RetenoReactNativeApplication

class MainApplication : Application(), ReactApplication, RetenoReactNativeApplication {

  private lateinit var retenoInstance: Reteno


  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override fun getRetenoInstance(): Reteno {
    return Reteno.instance
  }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(this.applicationContext, reactNativeHost)


  override fun getReactContext(): ReactContext? {
    return this.reactNativeHost.reactInstanceManager.currentReactContext
  }
  override fun onCreate() {
    super.onCreate()
    Reteno.initWithConfig(RetenoConfig.Builder()
      .accessKey("630A66AF-C1D3-4F2A-ACC1-0D51C38D2B05").build())
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
  }
}
