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

export enum CustomEventTypes {
  screenView = 'screenView',
}

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

export type AnonymousUserAttributes = Pick<
  UserAttributes,
  'firstName' | 'lastName' | 'languageCode' | 'timeZone' | 'address' | 'fields'
>;

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

export type AppInboxStatus = 'OPENED' | 'UNOPENED';

export type GetAppInboxMessages = {
  page?: number;
  pageSize?: number;
  status?: AppInboxStatus;
};

export type InAppDisplayData = {
  id?: string;
  source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
};

export type InAppCloseData = {
  id?: string;
  source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
  closeAction?: 'OPEN_URL' | 'BUTTON' | 'CLOSE_BUTTON';
};

export type InAppErrorData = {
  id?: string;
  source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
  errorMessage?: string;
};

export type InAppCustomData = {
  customData?: Record<string, any>;
  inapp_id?: string;
  inapp_source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
  url?: string;
};

export type RecommendationsPayload = {
  recomVariantId: string;
  productIds: string[];
  categoryId: string;
  filters?: { [key: string]: any }[];
  fields: string[];
};

export type RecommendationEvent = {
  productId: string;
};

export type RecommendationEventPayload = {
  recomVariantId: string;
  impressions: RecommendationEvent[];
  clicks: RecommendationEvent[];
  // forcePush is only for IOS
  forcePush?: boolean;
};

export type InboxMessage = {
  id: string;
  title: string;
  createdDate: string;
  imageURL?: string;
  linkURL?: string;
  isNew: boolean;
  content?: string;
  // Only on Android
  category?: string;
  status?: AppInboxStatus;
};

export type UnreadMessagesCountData = {
  count: number;
};

export type UnreadMessagesCountErrorData = {
  statusCode?: number | null;
  response?: string | null;
  error?: string | null;
};

export type PushButton = {
  actionId: string;
  customData: string | null;
  actionLink: string | null;
  userInfo: any;
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

export function getRecommendations(
  payload: RecommendationsPayload
): Promise<any> {
  return RetenoSdk.getRecommendations(payload);
}

export function logRecommendationEvent(
  payload: RecommendationEventPayload
): Promise<void> {
  return RetenoSdk.logRecommendationEvent(payload);
}

const eventEmitter =
  Platform.OS === 'android'
    ? DeviceEventEmitter
    : new NativeEventEmitter(RetenoSdk);

export function setOnRetenoPushReceivedListener(
  listener: (event: any) => void
) {
  return eventEmitter.addListener('reteno-push-received', listener);
}

export function setOnRetenoPushClickedListener(listener: (event: any) => void) {
  return eventEmitter.addListener('reteno-push-clicked', listener);
}

/**
 * iOS Only
 */
export function setOnRetenoPushButtonClickedListener(
  listener: (event: PushButton) => void
) {
  if (Platform.OS === 'ios') {
    return eventEmitter.addListener('reteno-push-button-clicked', listener);
  }

  return undefined;
}

export function setInAppLifecycleCallback() {
  RetenoSdk.setInAppLifecycleCallback();
}

/**
 * Android Only
 */
export function removeInAppLifecycleCallback() {
  if (Platform.OS === 'android') {
    RetenoSdk.removeInAppLifecycleCallback();
  }
}

export function beforeInAppDisplayHandler(
  callback: (data: InAppDisplayData) => void
) {
  return eventEmitter.addListener('reteno-before-in-app-display', (data) => {
    if (callback && typeof callback === 'function') {
      callback(data);
    }
  });
}

export function onInAppDisplayHandler(
  callback: (data: InAppDisplayData) => void
) {
  return eventEmitter.addListener('reteno-on-in-app-display', (data) => {
    if (callback && typeof callback === 'function') {
      callback(data);
    }
  });
}

export function beforeInAppCloseHandler(
  callback: (data: InAppCloseData) => void
) {
  return eventEmitter.addListener('reteno-before-in-app-close', (data) => {
    if (callback && typeof callback === 'function') {
      callback(data);
    }
  });
}

export function afterInAppCloseHandler(
  callback: (data: InAppCloseData) => void
) {
  return eventEmitter.addListener('reteno-after-in-app-close', (data) => {
    if (callback && typeof callback === 'function') {
      callback(data);
    }
  });
}

export function onInAppErrorHandler(callback: (data: InAppErrorData) => void) {
  return eventEmitter.addListener('reteno-on-in-app-error', (data) => {
    if (callback && typeof callback === 'function') {
      callback(data);
    }
  });
}

export function addInAppMessageCustomDataHandler(
  callback: (data: InAppCustomData) => void
) {
  return eventEmitter.addListener(
    'reteno-in-app-custom-data-received',
    (data) => {
      if (callback && typeof callback === 'function') {
        callback(data);
      }
    }
  );
}

/**
 * Log event
 * @param eventName name of the event
 * @param date date parameter should be in ISO8601 format, e.g new Date().toISOString()
 * @param parameters custom parameters
 * @param forcePush IOS force push
 */
export function logEvent(
  eventName: string,
  // date parameter should be in ISO8601 format
  date: string,
  parameters: CustomEventParameter[],
  forcePush?: boolean
): Promise<void> {
  return RetenoSdk.logEvent({
    eventName,
    date,
    parameters,
    forcePush,
  });
}

/**
 * IOS Only
 */
export function registerForRemoteNotifications() {
  if (Platform.OS === 'ios') {
    RetenoSdk.registerForRemoteNotifications();
  }
}

export function setAnonymousUserAttributes(
  payload: AnonymousUserAttributes
): Promise<void> {
  return RetenoSdk.setAnonymousUserAttributes(payload);
}

export function pauseInAppMessages(isPaused: boolean): Promise<void> {
  return RetenoSdk.pauseInAppMessages(isPaused);
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
/**
 * Send log screen view event
 * @param screenName name of the screen
 */
export function logScreenView(screenName: string) {
  return logEvent(CustomEventTypes.screenView, new Date().toISOString(), [
    { name: CustomEventTypes.screenView, value: screenName },
  ]);
}

/**
 *
 * Android only
 *
 * Since Android 13 was released you have to make sure you are handling Notification runtime permissions
 *
 * When user accepts permission, you have to call updatePushPermissionStatus() function from Reteno interface to notify the Reteno SDK that user has granted the permission.
 */
export function updatePushPermissionStatusAndroid(): Promise<void> {
  if (Platform.OS === 'android') {
    return RetenoSdk.updatePushPermissionStatusAndroid();
  }
  return Promise.resolve(undefined);
}

export function getAppInboxMessages(payload: GetAppInboxMessages): Promise<{
  messages: InboxMessage[];
  totalPages: number;
}> {
  return RetenoSdk.getAppInboxMessages(payload);
}

export function onUnreadMessagesCountChanged() {
  RetenoSdk.onUnreadMessagesCountChanged();
}

/**
 * Android Only
 */
export function unsubscribeMessagesCountChanged() {
  if (Platform.OS === 'android') {
    RetenoSdk.unsubscribeMessagesCountChanged();
  }
}

/**
 * Android Only
 */
export function unsubscribeAllMessagesCountChanged() {
  if (Platform.OS === 'android') {
    RetenoSdk.unsubscribeAllMessagesCountChanged();
  }
}

export function unreadMessagesCountHandler(
  callback: (data: UnreadMessagesCountData) => void
) {
  return eventEmitter.addListener('reteno-unread-messages-count', (data) => {
    if (callback && typeof callback === 'function') {
      callback(data);
    }
  });
}

/**
 * Android Only
 */
export function unreadMessagesCountErrorHandler(
  callback: (data: UnreadMessagesCountErrorData) => void
) {
  if (Platform.OS === 'android') {
    return eventEmitter.addListener(
      'reteno-unread-messages-count-error',
      (data) => {
        if (callback && typeof callback === 'function') {
          callback(data);
        }
      }
    );
  }

  return undefined;
}

export function markAsOpened(
  messageIds: string[]
): Promise<{ ids: string[]; status: string } | UnreadMessagesCountErrorData> {
  const response = {
    ids: messageIds,
    status: messageIds?.length ? 'OPENED' : '',
  };

  if (Platform.OS === 'android') {
    return RetenoSdk.markAsOpened(messageIds?.[0]).then(
      () => response,
      (error: any) => Promise.reject(error)
    );
  }

  return RetenoSdk.markAsOpened(messageIds).then(
    () => response,
    (error: any) => Promise.reject(error)
  );
}

export function markAllAsOpened(): Promise<
  { status: string } | UnreadMessagesCountErrorData
> {
  return RetenoSdk.markAllAsOpened().then(
    () => ({ status: 'OPENED' }),
    (error: any) => Promise.reject(error)
  );
}

export function getAppInboxMessagesCount(): Promise<number> {
  return RetenoSdk.getAppInboxMessagesCount();
}

//ECOMMERCE EVENTS

export type EcomAttribute = {
  name: string;
  value: (string | null)[];
};

export type EcomSimpleAttribute = {
  name: string;
  value: string;
};

export type EcomProductView = {
  productId: string;
  price: number;
  isInStock: boolean;
  attributes?: EcomAttribute[] | null;
};

export type EcomCartItem = {
  productId: string;
  quantity: number;
  price: number;
  discount?: number | null;
  name?: string | null;
  category?: string | null;
};

export enum OrderStatus {
  Initialized,
  InProgress,
  Delivered,
  Cancelled,
}

export type EcomOrder = {
  externalOrderId: string;
  externalCustomerId?: string | null;
  totalCost: number;
  status: OrderStatus;
  cartId?: string | null;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  shipping?: number | null;
  discount?: number | null;
  taxes?: number | null;
  restoreId?: string | null;
  statusDescription?: string | null;
  storeId?: string | null;
  source?: string | null;
  deliveryMethod?: string | null;
  deliveryAddress?: string | null;
  paymentMethod?: string | null;
  orderItems?: EcomOrderItem[] | null;
  attributes?: EcomSimpleAttribute[] | null;
};

export type EcomOrderItem = {
  externalItemId: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  url: string;
  imageUrl?: string | null;
  description?: string | null;
};

export type EcomCategoryView = {
  productCategoryId: string;
  attributes?: EcomAttribute[] | null;
};

export type EcomEventProductViewedPayload = {
  product: EcomProductView;
  currencyCode?: string | null;
};

// Function to log product viewed event
export function logEcomEventProductViewed(
  payload: EcomEventProductViewedPayload
): Promise<void> {
  return RetenoSdk.logEcomEventProductViewed(payload);
}

/**
 * 2. Product Category Viewed Event
 */

// Type for product category viewed event
export type EcomEventProductCategoryViewedPayload = {
  category: EcomCategoryView;
};

// Function to log product category viewed event
export function logEcomEventProductCategoryViewed(
  payload: EcomEventProductCategoryViewedPayload
): Promise<void> {
  return RetenoSdk.logEcomEventProductCategoryViewed(payload);
}

/**
 * 3. Product Added to Wishlist Event
 */

// Type for product added to wishlist event
export type EcomEventProductAddedToWishlistPayload = {
  product: EcomProductView;
  currencyCode?: string | null;
};

// Function to log product added to wishlist event
export function logEcomEventProductAddedToWishlist(
  payload: EcomEventProductAddedToWishlistPayload
): Promise<void> {
  return RetenoSdk.logEcomEventProductAddedToWishlist(payload);
}

/**
 * 4. Cart Updated Event
 */

export type EcomEventCartUpdatedPayload = {
  cartItems: EcomCartItem[];
  currencyCode?: string | null;
  cartId: string;
};

// Function to log product added to cart event
export function logEcomEventCartUpdated(
  payload: EcomEventCartUpdatedPayload
): Promise<void> {
  return RetenoSdk.logEcomEventCartUpdated(payload);
}

/**
 * 5. Order Created Event
 */

export type EcomEventOrderCreatedPayload = {
  order: EcomOrder;
  currencyCode?: string | null;
};

export function logEcomEventOrderCreated(
  payload: EcomEventOrderCreatedPayload
): Promise<void> {
  return RetenoSdk.logEcomEventOrderCreated(payload);
}

/**
 * 6. Order Updated
 */

export type EcomEventOrderUpdatedPayload = {
  order: EcomOrder;
  currencyCode?: string | null;
};

export function logEcomEventOrderUpdated(
  payload: EcomEventOrderUpdatedPayload
): Promise<void> {
  return RetenoSdk.logEcomEventOrderUpdated(payload);
}

/**
 * 7. Order Delivered
 */

export type EcomEventOrderDeliveredPayload = {
  externalOrderId: string;
};

// Function to log checkout started event
export function logEcomEventOrderDelivered(
  payload: EcomEventOrderDeliveredPayload
): Promise<void> {
  return RetenoSdk.logEcomEventOrderDelivered(payload);
}

/**
 * 8. Order Cancelled
 */

export type EcomEventOrderCancelledPayload = {
  externalOrderId: string;
};

// Function to log order placed event
export function logEcomEventOrderCancelled(
  payload: EcomEventOrderCancelledPayload
): Promise<void> {
  return RetenoSdk.logEcomEventOrderCancelled(payload);
}

/**
 * 9. Search Request Event
 */

export type EcomEventSearchRequestPayload = {
  searchQuery: string;
  isFound: boolean;
};

export function logEcomEventSearchRequest(
  payload: EcomEventSearchRequestPayload
): Promise<void> {
  return RetenoSdk.logEcomEventSearchRequest(payload);
}
