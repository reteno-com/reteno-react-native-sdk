package com.retenosdk;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.reteno.core.domain.model.event.Event;
import com.reteno.core.domain.model.event.Parameter;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

public class RetenoEvent {
  private static List<Parameter> buildEventParameters(ReadableArray inputParameters) {
    int countView = inputParameters.size();
    if (countView == 0) return null;

    List<Parameter> list = new ArrayList<>();
    for (int i = 0; i < countView; i++) {
      ReadableMap field = inputParameters.getMap(i);

      String name = null;
      String value = null;

      if (field.getString("name") != null) {
        name = field.getString("name");
      }
      if (field.getString("value") != null) {
        value = field.getString("value");
      }

      if (name != null) {
        list.add(new Parameter(name, value));
      }
    }
    return list;
  }

  public static Event buildEventFromPayload(ReadableMap payload) throws Exception {
    String eventName = RetenoUtil.getStringOrNull(payload.getString("eventName"));
    String stringDate = payload.getString("date");
    ReadableArray inputParameters = payload.getArray("parameters");

    List<Parameter> parameters = null;

    ZonedDateTime date;

    if (eventName == null) {
      throw new Exception("logEvent: missing 'eventName' parameter!");
    }

    if (stringDate != null) {
      date = ZonedDateTime.parse(stringDate);
    } else {
      date = ZonedDateTime.now();
    }

    if (inputParameters != null) {
      parameters = buildEventParameters(inputParameters);
    }

    return new Event.Custom(eventName, date, parameters);
  }
}
