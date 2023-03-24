package com.retenosdk;

public class RetenoUtil {
  public static String getStringOrNull(String input) {
    if (input == null) return null;
    if (input.isEmpty()) return null;
    return input;
  }
}
