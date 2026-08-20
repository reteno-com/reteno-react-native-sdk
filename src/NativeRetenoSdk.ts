import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

type UnsafeObject = Object;

export interface Spec extends TurboModule {
  addListener(eventName: string): void;
  removeListeners(count: number): void;

  initialize(payload: UnsafeObject): Promise<boolean>;
  initializeEventHandler(): Promise<boolean>;

  setDeviceToken(deviceToken: string): Promise<void>;
  setUserAttributes(payload: UnsafeObject): Promise<void>;
  setMultiAccountUserAttributes(payload: UnsafeObject): Promise<void>;
  setAnonymousUserAttributes(payload: UnsafeObject): Promise<void>;

  logEvent(payload: UnsafeObject): Promise<void>;
  logScreenView(screenName: string): Promise<void>;
  forcePushData(): Promise<void>;

  getInitialNotification(): Promise<UnsafeObject | null>;

  registerForRemoteNotifications(): void;
  updatePushPermissionStatusAndroid(): Promise<void>;
  requestNotificationPermission(): Promise<boolean>;
  getNotificationPermissionStatus(): Promise<string>;

  setAutoOpenLinks(enabled: boolean): Promise<boolean>;
  getAutoOpenLinks(): Promise<boolean>;

  pauseInAppMessages(isPaused: boolean): Promise<void>;
  setInAppMessagesPauseBehaviour(behaviour: string): Promise<void>;
  setInAppLifecycleCallback(): Promise<void>;
  removeInAppLifecycleCallback(): Promise<void>;
  pausePushInAppMessages(isPaused: boolean): Promise<void>;
  setPushInAppMessagesPauseBehaviour(behaviour: string): Promise<void>;
  setNotificationGroupingRule(rule: UnsafeObject | null): Promise<void>;

  getRecommendations(payload: UnsafeObject): Promise<Array<UnsafeObject>>;
  logRecommendationEvent(payload: UnsafeObject): Promise<void>;

  getAppInboxMessages(payload: UnsafeObject): Promise<UnsafeObject>;
  onUnreadMessagesCountChanged(): Promise<void>;
  unsubscribeMessagesCountChanged(): Promise<void>;
  unsubscribeAllMessagesCountChanged(): Promise<void>;
  markAsOpened(messageIds: string[]): Promise<void>;
  markAllAsOpened(): Promise<UnsafeObject>;
  getAppInboxMessagesCount(): Promise<number>;

  logEcomEventProductViewed(payload: UnsafeObject): Promise<void>;
  logEcomEventProductCategoryViewed(payload: UnsafeObject): Promise<void>;
  logEcomEventProductAddedToWishlist(payload: UnsafeObject): Promise<void>;
  logEcomEventCartUpdated(payload: UnsafeObject): Promise<void>;
  logEcomEventOrderCreated(payload: UnsafeObject): Promise<void>;
  logEcomEventOrderUpdated(payload: UnsafeObject): Promise<void>;
  logEcomEventOrderDelivered(payload: UnsafeObject): Promise<void>;
  logEcomEventOrderCancelled(payload: UnsafeObject): Promise<void>;
  logEcomEventSearchRequest(payload: UnsafeObject): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('RetenoSdk');
