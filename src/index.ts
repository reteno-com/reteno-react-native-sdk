import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

const LINKING_ERROR =
  `The package 'reteno-react-native-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

export type Address = {
  region?: string | null;
  town?: string | null;
  address?: string | null;
  postcode?: string | null;
};

type Field = {
  key: string;
  value: string;
};

type Fields = Field[];

export type UserAttributes = {
  phone?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  timeZone?: string | null;
  address?: Address | null;
  fields?: Fields | null;
};

export type User = {
  userAttributes?: UserAttributes | null;
  subscriptionKeys?: String[] | null;
  groupNamesInclude?: String[] | null;
  groupNamesExclude?: String[] | null;
};

export type SetUserAttributesPayload = {
  externalUserId: string;
  user: User;
};

export type CustomEventParameter = {
  name: string;
  value?: string;
};

const RetenoSdk = NativeModules.RetenoSdk
  ? NativeModules.RetenoSdk
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function setDeviceToken(deviceToken: string): Promise<void> {
  return RetenoSdk.setDeviceToken(deviceToken);
}

export function setUserAttributes(
  payload: SetUserAttributesPayload
): Promise<void> {
  if (
    !payload.externalUserId ||
    (payload.externalUserId && payload.externalUserId.length === 0)
  ) {
    throw new Error('Missing argument: "externalUserId"');
  }
  return RetenoSdk.setUserAttributes(payload);
}

export function getInitialNotification(): Promise<any> {
  return RetenoSdk.getInitialNotification();
}

const eventEmitter = Platform.select({
  ios: new NativeEventEmitter(RetenoSdk),
  // @ts-ignore
  android: DeviceEventEmitter,
});

export function setOnRetenoPushReceivedListener(
  listener: (event: any) => void
) {
  return eventEmitter.addListener('reteno-push-received', listener);
}

export function logEvent(
  eventName: string,
  date: string,
  // date parameter should be in ISO8601 format
  parameters: CustomEventParameter[],
  forcePush?: boolean
) {
  return RetenoSdk.logEvent({
    eventName,
    date,
    parameters,
    forcePush,
  });
}

export function registerForRemoteNotifications() {
  if (Platform.OS === 'ios') {
    RetenoSdk.registerForRemoteNotifications();
  }
}
/**
 *
 * Reteno caches all events (events, device data, user information, user behavior, screen tracking, push statuses, etc) locally into database
 * Call this function to send all accumulated events
 */
export function forcePushData(): Promise<void> {
  if (Platform.OS === 'ios') {
    // for ios we have to use this hack, because there isn't separate forcePush function as on android, sending an event with forcePush flag does the same thing
    return logEvent('', new Date().toISOString(), [], true);
  } else return RetenoSdk.forcePushData();
}
