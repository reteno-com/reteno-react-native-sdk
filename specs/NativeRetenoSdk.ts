import { InboxMessage } from './../src/index';
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  readonly onRetenoPushReceived: EventEmitter<unknown>;

  readonly onRetenoPushClicked: EventEmitter<unknown>;

  readonly onRetenoPushButtonClicked: EventEmitter<unknown>;

  readonly beforeInAppDisplayHandler: EventEmitter<void>;

  readonly onInAppDisplayHandler: EventEmitter<void>;

  readonly beforeInAppCloseHandler: EventEmitter<void>;

  readonly afterInAppCloseHandler: EventEmitter<void>;

  readonly onInAppErrorHandler: EventEmitter<{
    id?: string;
    source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
    errorMessage?: string;
  }>;

  readonly addInAppMessageCustomDataHandler: EventEmitter<{
    customData?: { [key: string]: unknown };
    inapp_id?: string;
    inapp_source?: 'DISPLAY_RULES' | 'PUSH_NOTIFICATION';
    url?: string;
  }>;

  readonly unreadMessagesCountHandler: EventEmitter<{ count: number }>;

  readonly unreadMessagesCountErrorHandler: EventEmitter<{
    statusCode?: number | null;
    response?: string | null;
    error?: string | null;
  }>;

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

export default TurboModuleRegistry.getEnforcing<Spec>('NativeRetenoSdk');
