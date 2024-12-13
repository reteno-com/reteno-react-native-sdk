import { InboxMessage } from '../index';
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  logEvent: (payload: { [key: string]: unknown }) => Promise<void>;

  setDeviceToken: (deviceToken: string) => Promise<void>;

  setUserAttributes: (payload: { [key: string]: unknown }) => Promise<void>;

  getInitialNotification: () => Promise<unknown>;

  registerForRemoteNotifications: () => Promise<boolean>;

  setAnonymousUserAttributes: (payload: {
    [key: string]: unknown;
  }) => Promise<void>;

  pauseInAppMessages: (isPaused: boolean) => Promise<void>;

  forcePushData: () => Promise<void>;

  updatePushPermissionStatusAndroid: () => Promise<void>;

  getRecommendations: (payload: {
    [key: string]: unknown;
  }) => Promise<Array<{ [key: string]: unknown }>>;

  logRecommendationEvent: (payload: {
    [key: string]: unknown;
  }) => Promise<void>;

  getAppInboxMessages: (payload: { [key: string]: unknown }) => Promise<{
    messages: InboxMessage[];
    totalPages: number;
  }>;

  markAsOpened: (messageIds: string[]) => Promise<boolean>;

  markAllAsOpened: () => Promise<boolean>;

  getAppInboxMessagesCount: () => Promise<number>;

  onUnreadMessagesCountChanged: () => void;

  setInAppLifecycleCallback: () => void;

  removeInAppLifecycleCallback: () => void;

  unsubscribeMessagesCountChanged: () => void;

  unsubscribeAllMessagesCountChanged: () => void;

  addListener: (event: string) => void;

  removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.get<Spec>('RetenoSdk') as Spec | null;
