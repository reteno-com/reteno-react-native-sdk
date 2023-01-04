package com.retenosdk;
import com.facebook.react.bridge.ReactContext;
import com.reteno.core.RetenoApplication;

public interface RetenoReactNativeApplication extends RetenoApplication {
  public ReactContext getReactContext();
}
