## Installation


1. Run next command from root of your project:

```sh
yarn add react-native-reteno-sdk
```
2. Add mavenCentral repository in your project level `build.gradle`:
```groovy
buildscript { 
    repositories { 
        mavenCentral() 
    } 
... 
}
```
3. Also you may need to increase `minSdkVersion` in project level `build.gradle` to `26`, since `Reteno` uses this version as minimal;

## Setting up SDK

1. Follow `Step 1` described in Android SDK setup guide: [link](https://docs.reteno.com/reference/android-sdk-setup#step-1-make-sure-to-enable-androidx-in-your-gradleproperties-file);

2. Follow `Step 2` described in Android SDK setup guide: [link](https://docs.reteno.com/reference/android-sdk-setup#step-2-make-sure-to-add-comretenofcm-and-firebase-dependencies-in-buildgradle);

3. Edit your MainApplication class and provider API Access-Key at SDK initialization.

Below is sample code you can add to your application class which gets you started with `RetenoSDK`.

```java
package [com.YOUR_PACKAGE];

import android.app.Application;

import androidx.annotation.NonNull;

import android.content.Context;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.soloader.SoLoader;
import com.reteno.sample.newarchitecture.MainApplicationReactNativeHost;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

import com.reteno.core.Reteno;
import com.reteno.core.RetenoImpl;
import com.retenosdk.RetenoReactNativeApplication;

public class MainApplication extends Application implements ReactApplication, RetenoReactNativeApplication {

    private Reteno retenoInstance;

    @Override
    public void onCreate() {
        super.onCreate();
        retenoInstance = new RetenoImpl(this, "your_access_key_here");
    }

    @NonNull
    @Override
    public Reteno getRetenoInstance() {
        return retenoInstance;
    }

    @Override
    public ReactContext getReactContext() {
        return this.getReactNativeHost().getReactInstanceManager().getCurrentReactContext();
    };
}
```

4. Follow `Step 5` described in Android SDK setup guide: [link](https://docs.reteno.com/reference/android-sdk-setup#step-5-make-sure-to-set-up-your-firebase-application-for-firebase-cloud-messaging);
