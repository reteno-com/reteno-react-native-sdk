import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import NativeRetenoSdk from './NativeRetenoSdk';

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
  marketId?: string | null;
  address?: Address | null;
  fields?: Fields | null;
};

export type AnonymousUserAttributes = Pick<
  UserAttributes,
  | 'firstName'
  | 'lastName'
  | 'languageCode'
  | 'timeZone'
  | 'marketId'
  | 'address'
  | 'fields'
>;

export type User = {
  userAttributes?: UserAttributes | null;
  subscriptionKeys?: string[] | null;
  groupNamesInclude?: string[] | null;
  groupNamesExclude?: string[] | null;
};

export type SetUserAttributesPayload = {
  externalUserId: string;
  user: User;
};

export type SetMultiAccountUserAttributesPayload = SetUserAttributesPayload;

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
  closeAction?: 'OPEN_URL' | 'BUTTON' | 'CLOSE_BUTTON' | 'UNKNOWN';
  isCloseButtonClicked?: boolean;
  isButtonClicked?: boolean;
  isOpenUrlClicked?: boolean;
};

export type InAppErrorData = {
  id?: string;
  source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
  errorMessage?: string;
};

export type InAppPauseBehaviour = 'SKIP_IN_APPS' | 'POSTPONE_IN_APPS';

export type LifecycleTrackingOptions =
  | 'ALL'
  | 'NONE'
  | {
      appLifecycleEnabled?: boolean;
      foregroundLifecycleEnabled?: boolean;
      pushSubscriptionEnabled?: boolean;
      sessionStartEventsEnabled?: boolean;
      sessionEndEventsEnabled?: boolean;
      // Backward-compat flag
      sessionEventsEnabled?: boolean;
    };

export type DeviceTokenHandlingMode = 'automatic' | 'manual';

export type InitializeOptions = {
  apiKey: string;
  isDebugMode?: boolean;
  pauseInAppMessages?: boolean;
  sessionDurationSeconds?: number;
  lifecycleTrackingOptions?: LifecycleTrackingOptions;
  /**
   * iOS only. Controls how the device push token is obtained and forwarded to Reteno.
   *
   * - `'automatic'` (default): Reteno swizzles the AppDelegate to capture the APNs token
   *   automatically. Use this when the app does NOT use Firebase / @react-native-firebase.
   *
   * - `'manual'`: Reteno skips AppDelegate swizzling. Required when the app uses
   *   `@react-native-firebase/messaging` (avoids `GULAppDelegateProxy` conflicts).
   *   The SDK automatically detects Firebase at runtime and bridges the FCM token to
   *   Reteno — no manual `setDeviceToken` call is needed. If Firebase is not present,
   *   you can still supply the token manually via `setDeviceToken(token)`.
   */
  iosDeviceTokenHandlingMode?: DeviceTokenHandlingMode;
};

export type NotificationPermissionStatus =
  | 'ALLOWED'
  | 'DENIED'
  | 'PERMANENTLY_DENIED';

export type InAppCustomData = {
  customData?: Record<string, unknown>;
  inapp_id?: string;
  inapp_source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
  url?: string;
};

/** Alias for {@link InAppCustomData}, named to match the other typed event payloads. */
export type RetenoInAppCustomDataEvent = InAppCustomData;

export type RecomFilter = {
  name: string;
  values: string[];
};

export type RecommendationsPayload = {
  recomVariantId: string;
  productIds: string[];
  categoryId: string;
  /**
   * Android currently ignores this field (the bridge never reads it from the payload,
   * see `RetenoSdkModule.getRecommendations`) — only iOS applies filters today.
   */
  filters?: RecomFilter[];
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
  /**
   * Format differs by platform (pre-existing, not introduced here): Android sends the raw
   * date string from the API as-is; iOS sends a Unix timestamp in seconds
   * (`Date.timeIntervalSince1970`) as a number. Normalizing this to one shape across
   * platforms is a bridge change, tracked separately — not done as part of this typing pass.
   */
  createdDate: string | number;
  imageURL?: string;
  linkURL?: string;
  isNew: boolean;
  content?: string;
  category?: string;
  // Only on Android — the iOS native SDK has no equivalent concept.
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

/**
 * Raw native push payload, forwarded as-is from FCM/APNs. The `es_*` keys below are set by
 * Reteno on every Reteno-originated push and are confirmed present on both native SDKs
 * (iOS: `RetenoUserNotification.swift`; Android: `RetenoSdkPush/Constants.kt`). Everything
 * else is app- or campaign-specific and intentionally left open via the index signature —
 * do not assume a fixed shape beyond these.
 */
export type RetenoPushPayload = {
  /** Correlates this push back to a Reteno interaction (opens/clicks reporting). */
  es_interaction_id?: string;
  /** Wrapped/tracked deep link. */
  es_link?: string;
  /** Original, unwrapped deep link. */
  es_link_raw?: string;
  /** Main notification image URL. */
  es_notification_image?: string;
  /** JSON-encoded carousel image URLs. */
  es_notification_images?: string;
  /** JSON-encoded action buttons definition. */
  es_buttons?: string;
  /** Present when this push also carries a push-triggered in-app message. */
  es_inapp?: string;
  [key: string]: unknown;
};

export type RetenoPushReceivedEvent = RetenoPushPayload;
export type RetenoPushClickedEvent = RetenoPushPayload;
export type RetenoPushDismissedEvent = RetenoPushPayload;
export type RetenoCustomPushDataEvent = RetenoPushPayload;
export type RetenoInitialNotification = RetenoPushPayload;

export type PushButton = {
  actionId: string;
  /** Raw string as forwarded by the native SDK (commonly JSON-encoded) — not parsed here. */
  customData: string | null;
  actionLink: string | null;
  userInfo: RetenoPushPayload;
};

export type RetenoPushButtonClickedEvent = PushButton;

const nativeRetenoSdk = NativeRetenoSdk ?? NativeModules.RetenoSdk;

const RetenoSdk = nativeRetenoSdk
  ? nativeRetenoSdk
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export type RetenoEventPayloadMap = {
  pushReceived: RetenoPushReceivedEvent;
  pushClicked: RetenoPushClickedEvent;
  pushButtonClicked: RetenoPushButtonClickedEvent;
  pushDismissed: RetenoPushDismissedEvent;
  customPushData: RetenoCustomPushDataEvent;
  beforeInAppDisplay: InAppDisplayData;
  inAppDisplay: InAppDisplayData;
  beforeInAppClose: InAppCloseData;
  afterInAppClose: InAppCloseData;
  inAppError: InAppErrorData;
  inAppCustomData: RetenoInAppCustomDataEvent;
  unreadMessagesCountChanged: UnreadMessagesCountData;
  unreadMessagesCountError: UnreadMessagesCountErrorData;
};

export type RetenoEventType = keyof RetenoEventPayloadMap;

export type RetenoEventListener<T extends RetenoEventType> = (
  event: RetenoEventPayloadMap[T]
) => void;

export type RetenoSubscription = {
  remove(): void;
};

const RETENO_NATIVE_EVENTS: Record<RetenoEventType, string> = {
  pushReceived: 'reteno-push-received',
  pushClicked: 'reteno-push-clicked',
  pushButtonClicked: 'reteno-push-button-clicked',
  pushDismissed: 'reteno-push-dismissed',
  customPushData: 'reteno-custom-push-received',
  beforeInAppDisplay: 'reteno-before-in-app-display',
  inAppDisplay: 'reteno-on-in-app-display',
  beforeInAppClose: 'reteno-before-in-app-close',
  afterInAppClose: 'reteno-after-in-app-close',
  inAppError: 'reteno-on-in-app-error',
  inAppCustomData: 'reteno-in-app-custom-data-received',
  unreadMessagesCountChanged: 'reteno-unread-messages-count',
  unreadMessagesCountError: 'reteno-unread-messages-count-error',
};

const PLATFORM_EVENT_SUPPORT: Partial<
  Record<RetenoEventType, 'ios' | 'android'>
> = {
  pushButtonClicked: 'ios',
  pushDismissed: 'android',
  customPushData: 'android',
  unreadMessagesCountError: 'android',
};

const eventEmitter = new NativeEventEmitter(RetenoSdk);

const eventSubscriptions = new Map<
  RetenoEventType,
  Map<RetenoEventListener<RetenoEventType>, RetenoSubscription>
>();

const noopSubscription: RetenoSubscription = {
  remove: () => undefined,
};

function warnUnsupportedEvent(
  eventName: RetenoEventType,
  supportedPlatform: string
) {
  const isDev =
    typeof globalThis !== 'undefined' &&
    Boolean((globalThis as { __DEV__?: boolean }).__DEV__);

  if (isDev) {
    console.warn(
      `Reteno event "${eventName}" is only supported on ${supportedPlatform}. Returning a no-op subscription.`
    );
  }
}

function isEventSupportedOnCurrentPlatform(eventName: RetenoEventType) {
  const supportedPlatform = PLATFORM_EVENT_SUPPORT[eventName];
  return !supportedPlatform || Platform.OS === supportedPlatform;
}

export function initialize(
  input: string | InitializeOptions
): Promise<boolean> {
  const payload: InitializeOptions =
    typeof input === 'string' ? { apiKey: input } : input;

  if (!payload?.apiKey || payload.apiKey.trim().length === 0) {
    return Promise.reject(new Error('Missing argument: "apiKey"'));
  }

  return RetenoSdk.initialize({
    ...payload,
    apiKey: payload.apiKey.trim(),
  });
}

/**
 * iOS: forwards the APNs/FCM token to Reteno via Reteno.userNotificationService.
 * Android: no-op (the Reteno FCM library auto-receives tokens via
 * RetenoFirebaseMessagingService registered in the library manifest).
 * The Promise still resolves so cross-platform code can `await` it uniformly.
 */
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
    return Promise.reject(new Error('Missing argument: "externalUserId"'));
  }
  return RetenoSdk.setUserAttributes(payload);
}

export function getInitialNotification(): Promise<RetenoInitialNotification | null> {
  return RetenoSdk.getInitialNotification();
}

/**
 * Recommendation item shape depends on the `fields` requested in `payload.fields`,
 * so it's intentionally left open rather than a fixed structure.
 */
export type RetenoRecommendationItem = {
  [key: string]: unknown;
};

export function getRecommendations<T extends object = RetenoRecommendationItem>(
  payload: RecommendationsPayload
): Promise<T[]> {
  // The iOS bridge reads `filters` via a single `guard let` chain alongside the required
  // fields, so an absent key fails that guard and rejects the whole call with "Invalid
  // payload" — even though `filters` is optional in this API. Always send an array so the
  // optional JS type matches what the native side actually requires.
  return RetenoSdk.getRecommendations({
    ...payload,
    filters: payload.filters ?? [],
  });
}

export function logRecommendationEvent(
  payload: RecommendationEventPayload
): Promise<void> {
  return RetenoSdk.logRecommendationEvent(payload);
}

export function addEventListener<T extends RetenoEventType>(
  eventName: T,
  listener: RetenoEventListener<T>
): RetenoSubscription {
  const supportedPlatform = PLATFORM_EVENT_SUPPORT[eventName];
  if (!isEventSupportedOnCurrentPlatform(eventName)) {
    warnUnsupportedEvent(eventName, supportedPlatform ?? 'this platform');
    return noopSubscription;
  }

  const eventListeners =
    eventSubscriptions.get(eventName) ??
    new Map<RetenoEventListener<RetenoEventType>, RetenoSubscription>();
  eventSubscriptions.set(eventName, eventListeners);

  const registeredListener = listener as RetenoEventListener<RetenoEventType>;
  const existingSubscription = eventListeners.get(registeredListener);
  if (existingSubscription) {
    return existingSubscription;
  }

  const nativeSubscription: EmitterSubscription = eventEmitter.addListener(
    RETENO_NATIVE_EVENTS[eventName],
    (event) => listener(event as RetenoEventPayloadMap[T])
  );

  const subscription: RetenoSubscription = {
    remove: () => {
      nativeSubscription.remove();
      eventListeners.delete(registeredListener);
      if (eventListeners.size === 0) {
        eventSubscriptions.delete(eventName);
      }
    },
  };

  eventListeners.set(registeredListener, subscription);
  return subscription;
}

export function removeEventListener<T extends RetenoEventType>(
  eventName: T,
  listener: RetenoEventListener<T>
): void {
  const registeredListener = listener as RetenoEventListener<RetenoEventType>;
  const subscription = eventSubscriptions
    .get(eventName)
    ?.get(registeredListener);
  subscription?.remove();
}

/**
 * Initialize event handler. Call this after setting up all event listeners.
 * Events that occur before this call will be queued and delivered after initialization.
 *
 * @example
 * ```typescript
 * // 1. First, set up all your listeners
 * setOnRetenoPushReceivedListener((event) => {
 *   console.log('Push received:', event);
 * });
 *
 * // 2. Then initialize to start receiving events
 * initializeEventHandler();
 * ```
 *
 * @returns Promise that resolves to true when initialization is complete
 */
export function initializeEventHandler(): Promise<boolean> {
  return RetenoSdk.initializeEventHandler();
}

/**
 * Control whether SDK automatically opens URLs when user clicks on push notifications or in-app messages.
 *
 * @param enabled - true to auto-open URLs (default), false to handle URLs manually via event listeners
 * @returns Promise that resolves when setting is applied
 *
 * @example
 * ```typescript
 * // Disable automatic URL opening
 * setAutoOpenLinks(false);
 *
 * // Handle URLs manually
 * addInAppMessageCustomDataHandler((data) => {
 *   if (data.url) {
 *     // Custom URL handling logic
 *   }
 * });
 * ```
 */
export function setAutoOpenLinks(enabled: boolean): Promise<boolean> {
  return RetenoSdk.setAutoOpenLinks(enabled);
}

/**
 * Get the current auto-open links setting.
 *
 * @returns Promise that resolves to the current setting (true = auto-open enabled, false = disabled)
 *
 * @example
 * ```typescript
 * const isEnabled = await getAutoOpenLinks();
 * console.log('Auto open links:', isEnabled);
 * ```
 */
export function getAutoOpenLinks(): Promise<boolean> {
  return RetenoSdk.getAutoOpenLinks();
}

export function setOnRetenoPushReceivedListener(
  listener: (event: RetenoPushReceivedEvent) => void
) {
  return addEventListener('pushReceived', listener);
}

export function setOnRetenoPushClickedListener(
  listener: (event: RetenoPushClickedEvent) => void
) {
  return addEventListener('pushClicked', listener);
}

/**
 * iOS Only
 */
export function setOnRetenoPushButtonClickedListener(
  listener: (event: RetenoPushButtonClickedEvent) => void
) {
  return addEventListener('pushButtonClicked', listener);
}

export function setInAppLifecycleCallback() {
  return RetenoSdk.setInAppLifecycleCallback();
}

/**
 * Android Only
 */
export function removeInAppLifecycleCallback() {
  if (Platform.OS === 'android') {
    return RetenoSdk.removeInAppLifecycleCallback();
  }
  return Promise.resolve(undefined);
}

export function beforeInAppDisplayHandler(
  callback: (data: InAppDisplayData) => void
) {
  return addEventListener('beforeInAppDisplay', callback);
}

export function onInAppDisplayHandler(
  callback: (data: InAppDisplayData) => void
) {
  return addEventListener('inAppDisplay', callback);
}

export function beforeInAppCloseHandler(
  callback: (data: InAppCloseData) => void
) {
  return addEventListener('beforeInAppClose', callback);
}

export function afterInAppCloseHandler(
  callback: (data: InAppCloseData) => void
) {
  return addEventListener('afterInAppClose', callback);
}

export function onInAppErrorHandler(callback: (data: InAppErrorData) => void) {
  return addEventListener('inAppError', callback);
}

export function addInAppMessageCustomDataHandler(
  callback: (data: RetenoInAppCustomDataEvent) => void
) {
  return addEventListener('inAppCustomData', callback);
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
 * Set the behaviour when InApp messages pause is disabled.
 *
 * @param behaviour - 'SKIP_IN_APPS' to skip all messages that occurred during pause,
 *                    'POSTPONE_IN_APPS' to show the first postponed message when pause is lifted
 * @returns Promise that resolves when the behaviour is set
 */
export function setInAppMessagesPauseBehaviour(
  behaviour: InAppPauseBehaviour
): Promise<void> {
  return RetenoSdk.setInAppMessagesPauseBehaviour(behaviour);
}

/**
 * Set user attributes for multi-account mode.
 * Uses the externalUserId as the account suffix to create a separate device identity.
 *
 * @param payload - Contains externalUserId and user attributes
 * @returns Promise that resolves when attributes are set
 */
export function setMultiAccountUserAttributes(
  payload: SetMultiAccountUserAttributesPayload
): Promise<void> {
  if (!payload.externalUserId) {
    return Promise.reject(new Error('Missing argument: "externalUserId"'));
  }
  return RetenoSdk.setMultiAccountUserAttributes(payload);
}

/**
 *
 * Reteno caches all events (events, device data, user information, user behavior, screen tracking, push statuses, etc) locally into database
 * Call this function to send all accumulated events
 */
export function forcePushData(): Promise<void> {
  return RetenoSdk.forcePushData();
}
/**
 * Send log screen view event
 * @param screenName name of the screen
 */
export function logScreenView(screenName: string): Promise<void> {
  return RetenoSdk.logScreenView(screenName);
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

export function onUnreadMessagesCountChanged(): Promise<void> {
  return RetenoSdk.onUnreadMessagesCountChanged();
}

export function unsubscribeMessagesCountChanged(): Promise<void> {
  return RetenoSdk.unsubscribeMessagesCountChanged();
}

export function unsubscribeAllMessagesCountChanged(): Promise<void> {
  return RetenoSdk.unsubscribeAllMessagesCountChanged();
}

export function unreadMessagesCountHandler(
  callback: (data: UnreadMessagesCountData) => void
) {
  return addEventListener('unreadMessagesCountChanged', callback);
}

/**
 * Android Only
 */
export function unreadMessagesCountErrorHandler(
  callback: (data: UnreadMessagesCountErrorData) => void
) {
  return addEventListener('unreadMessagesCountError', callback);
}

export function markAsOpened(
  messageIds: string[]
): Promise<{ ids: string[]; status: string } | UnreadMessagesCountErrorData> {
  const response = {
    ids: messageIds,
    status: messageIds?.length ? 'OPENED' : '',
  };

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

/**
 * Android Only
 * Listen for push notification dismissed (swiped away) events.
 */
export function setOnRetenoPushDismissedListener(
  listener: (event: RetenoPushDismissedEvent) => void
): RetenoSubscription {
  return addEventListener('pushDismissed', listener);
}

/**
 * Android Only
 * Listen for custom push data events (silent/data-only push messages).
 */
export function setOnRetenoCustomPushDataListener(
  listener: (event: RetenoCustomPushDataEvent) => void
): RetenoSubscription {
  return addEventListener('customPushData', listener);
}

/**
 * Android Only.
 * Request notification permission. Returns true if granted, false otherwise.
 * Uses the new RetenoNotifications API introduced in SDK 2.9.0.
 *
 * On iOS the promise rejects — this method is not supported there. (Previously it
 * silently resolved to `false`, which looked like a real "denied" result.)
 */
export function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    return RetenoSdk.requestNotificationPermission();
  }
  return Promise.reject(
    new Error('requestNotificationPermission() is not supported on iOS')
  );
}

/**
 * Android Only.
 * Get current notification permission status.
 * Returns 'ALLOWED', 'DENIED', or 'PERMANENTLY_DENIED'.
 * Uses the new RetenoNotifications API introduced in SDK 2.9.0.
 *
 * On iOS the promise rejects — this method is not supported there. (Previously it
 * silently resolved to `'ALLOWED'`, which looked like a real permission read.)
 */
export function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === 'android') {
    return RetenoSdk.getNotificationPermissionStatus();
  }
  return Promise.reject(
    new Error('getNotificationPermissionStatus() is not supported on iOS')
  );
}

/**
 * Android Only
 * Pause or resume push-triggered in-app messages specifically.
 * Introduced in Android SDK 2.9.0.
 */
export function pausePushInAppMessages(isPaused: boolean): Promise<void> {
  if (Platform.OS === 'android') {
    return RetenoSdk.pausePushInAppMessages(isPaused);
  }
  return Promise.resolve(undefined);
}

/**
 * Android Only
 * Set the behaviour for push-triggered in-app messages when paused.
 * Introduced in Android SDK 2.9.0.
 */
export function setPushInAppMessagesPauseBehaviour(
  behaviour: InAppPauseBehaviour
): Promise<void> {
  if (Platform.OS === 'android') {
    return RetenoSdk.setPushInAppMessagesPauseBehaviour(behaviour);
  }
  return Promise.resolve(undefined);
}

/**
 * Android only. Groups notifications by a push payload value or a constant ID.
 * The rule is persisted natively and restored before the app starts, so it is
 * also applied to notifications received while the app is not running.
 */
export type NotificationGroupingRule =
  | { payloadKey: string; groupId?: never }
  | { groupId: string; payloadKey?: never };

/**
 * Android only. Groups notifications by a push payload value or a constant ID.
 * Pass `null` to disable grouping.
 */
export function setNotificationGroupingRule(
  rule: NotificationGroupingRule | null
): Promise<void> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(undefined);
  }

  if (rule === null) {
    return RetenoSdk.setNotificationGroupingRule(null);
  }

  if (!rule || typeof rule !== 'object') {
    return Promise.reject(
      new Error(
        'Invalid argument: expected null or an object with payloadKey or groupId'
      )
    );
  }

  const payloadKey =
    typeof rule.payloadKey === 'string' ? rule.payloadKey.trim() : '';
  const groupId = typeof rule.groupId === 'string' ? rule.groupId.trim() : '';
  if (!!payloadKey === !!groupId) {
    return Promise.reject(
      new Error(
        'Invalid argument: provide exactly one of payloadKey or groupId'
      )
    );
  }

  return RetenoSdk.setNotificationGroupingRule(
    payloadKey ? { payloadKey } : { groupId }
  );
}

export const user = {
  setAttributes: setUserAttributes,
  setMultiAccountAttributes: setMultiAccountUserAttributes,
  setAnonymousAttributes: setAnonymousUserAttributes,
} as const;

export const push = {
  setDeviceToken,
  registerForRemoteNotifications,
  getInitialNotification,
  setOnReceivedListener: setOnRetenoPushReceivedListener,
  setOnClickedListener: setOnRetenoPushClickedListener,
  setOnButtonClickedListener: setOnRetenoPushButtonClickedListener,
  setOnDismissedListener: setOnRetenoPushDismissedListener,
  setOnCustomDataListener: setOnRetenoCustomPushDataListener,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  updatePermissionStatusAndroid: updatePushPermissionStatusAndroid,
  pauseTriggeredInAppMessages: pausePushInAppMessages,
  setTriggeredInAppMessagesPauseBehaviour: setPushInAppMessagesPauseBehaviour,
  setGroupingRule: setNotificationGroupingRule,
} as const;

export const events = {
  addEventListener,
  removeEventListener,
  initializeEventHandler,
} as const;

export const inApp = {
  setLifecycleCallback: setInAppLifecycleCallback,
  removeLifecycleCallback: removeInAppLifecycleCallback,
  beforeDisplay: beforeInAppDisplayHandler,
  onDisplay: onInAppDisplayHandler,
  beforeClose: beforeInAppCloseHandler,
  afterClose: afterInAppCloseHandler,
  onError: onInAppErrorHandler,
  onCustomData: addInAppMessageCustomDataHandler,
  pauseMessages: pauseInAppMessages,
  setPauseBehaviour: setInAppMessagesPauseBehaviour,
  setAutoOpenLinks,
  getAutoOpenLinks,
} as const;

export const inbox = {
  getMessages: getAppInboxMessages,
  markAsOpened,
  markAllAsOpened,
  getMessagesCount: getAppInboxMessagesCount,
  subscribeUnreadCount: onUnreadMessagesCountChanged,
  unsubscribeUnreadCount: unsubscribeMessagesCountChanged,
  unsubscribeAllUnreadCount: unsubscribeAllMessagesCountChanged,
  onUnreadCountChanged: unreadMessagesCountHandler,
  onUnreadCountError: unreadMessagesCountErrorHandler,
} as const;

export const recommendations = {
  get: getRecommendations,
  logEvent: logRecommendationEvent,
} as const;

export const ecommerce = {
  productViewed: logEcomEventProductViewed,
  productCategoryViewed: logEcomEventProductCategoryViewed,
  productAddedToWishlist: logEcomEventProductAddedToWishlist,
  cartUpdated: logEcomEventCartUpdated,
  orderCreated: logEcomEventOrderCreated,
  orderUpdated: logEcomEventOrderUpdated,
  orderDelivered: logEcomEventOrderDelivered,
  orderCancelled: logEcomEventOrderCancelled,
  searchRequest: logEcomEventSearchRequest,
} as const;
