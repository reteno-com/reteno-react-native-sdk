package com.reteno.sample

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.soloader.SoLoader
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.reteno.core.Reteno
import com.reteno.core.RetenoConfig
import com.retenosdk.RetenoReactNativeApplication

class MainApplication : Application(), ReactApplication, RetenoReactNativeApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList = PackageList(this).packages
    )
  }

  override fun getRetenoInstance(): Reteno {
    return Reteno.instance
  }

  override fun getReactContext(): ReactContext? {
    return reactHost.currentReactContext
  }

  override fun onCreate() {
    super.onCreate()
    Reteno.initWithConfig(
      RetenoConfig.Builder()
        .accessKey("630A66AF-C1D3-4F2A-ACC1-0D51C38D2B05")
        .build()
    )
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      loadReactNative(this)
    }
  }
}
