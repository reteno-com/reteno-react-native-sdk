package com.retenosdk;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableArray;
import com.reteno.core.domain.model.user.Address;
import com.reteno.core.domain.model.user.User;
import com.reteno.core.domain.model.user.UserAttributes;
import com.reteno.core.domain.model.user.UserCustomField;

import java.util.ArrayList;
import java.util.List;

public class RetenoUserAttributes {
  private static List<UserCustomField> buildUserCustomData(ReadableArray fields) {
    int countView = fields.size();
    if (countView == 0) return null;

    List<UserCustomField> list = new ArrayList<>();
    for (int i = 0; i < countView; i++) {
      ReadableMap field = fields.getMap(i);

      String key = null;
      String value = null;

      if (field.getString("key") != null) {
        key = field.getString("key");
      }
      if (field.getString("value") != null) {
        value = field.getString("value");
      }

      if (key != null) {
        list.add(new UserCustomField(key, value));
      }
    }
    return list;
  }

  private static List<String> buildStringArr(ReadableMap user, String key) {
    if (user == null) {
      return null;
    }
    ReadableArray payloadStringArr = user.getArray("subscriptionKeys");
    if (payloadStringArr == null) {
      return null;
    }

    int countView = payloadStringArr.size();
    if (countView == 0) return null;

    List<String> stringArr = new ArrayList<>();
    for (int i = 0; i < countView; i++) {
      String str = payloadStringArr.getString(i);
      stringArr.add(str);
    }
    return stringArr;
  }

  public static User buildUserFromPayload(ReadableMap payload) {
    ReadableMap payloadUser = null;
    ReadableMap payloadUserAttributes = null;

    String payloadPhone = null;
    String payloadEmail = null;
    String payloadFirstName = null;
    String payloadLastName = null;
    String payloadLanguageCode = null;
    String payloadTimeZone = null;

    ReadableMap payloadAddress = null;
    ReadableArray payloadFields = null;

    Address address = null;
    List<UserCustomField> fields = null;

    payloadUser = payload.getMap("user");

    if (payloadUser != null) {
      payloadUserAttributes = payloadUser.getMap("userAttributes");
      if (payloadUserAttributes != null) {
        payloadPhone = payloadUserAttributes.getString("phone");
        payloadEmail = payloadUserAttributes.getString("email");
        payloadFirstName = payloadUserAttributes.getString("firstName");
        payloadLastName = payloadUserAttributes.getString("lastName");
        payloadLanguageCode = payloadUserAttributes.getString("languageCode");
        payloadTimeZone = payloadUserAttributes.getString("timeZone");
        payloadAddress = payloadUserAttributes.getMap("address");
        payloadFields = payloadUserAttributes.getArray("fields");
      }
    }

    if (payloadAddress != null) {
      address = new Address(
        RetenoUtil.getStringOrNull(payloadAddress.getString("region")),
        RetenoUtil.getStringOrNull(payloadAddress.getString("town")),
        RetenoUtil.getStringOrNull(payloadAddress.getString("address")),
        RetenoUtil.getStringOrNull(payloadAddress.getString("postcode"))
      );
    }

    if (payloadFields != null) {
      fields = buildUserCustomData(payloadFields);
    }

    UserAttributes userAttributes = new UserAttributes(
      RetenoUtil.getStringOrNull(payloadPhone),
      RetenoUtil.getStringOrNull(payloadEmail),
      RetenoUtil.getStringOrNull(payloadFirstName),
      RetenoUtil.getStringOrNull(payloadLastName),
      RetenoUtil.getStringOrNull(payloadLanguageCode),
      RetenoUtil.getStringOrNull(payloadTimeZone),
      address,
      fields
    );

    List<String> subscriptionKeys = buildStringArr(payloadUser, "subscriptionKeys");
    List<String> groupNamesInclude = buildStringArr(payloadUser, "groupNamesInclude");
    List<String> groupNamesExclude = buildStringArr(payloadUser, "groupNamesExclude");

    return new User(userAttributes, subscriptionKeys, groupNamesInclude, groupNamesExclude);
  }
}
