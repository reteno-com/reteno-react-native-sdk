// The mock native module is constructed *inside* the factory (self-contained) because
// `jest.mock` factories run before any module-scoped `const` declared above them: babel's
// jest hoisting moves the `import '../index'` below to the top of the file, ahead of any
// plain `const`, so a `mockRetenoSdk` defined outside this factory would still be
// `undefined` when the factory actually runs.
jest.mock('react-native', () => {
  const RetenoSdk = {
    initialize: jest.fn().mockResolvedValue(true),
    setUserAttributes: jest.fn().mockResolvedValue(undefined),
    setMultiAccountUserAttributes: jest.fn().mockResolvedValue(undefined),
    logEvent: jest.fn().mockResolvedValue(undefined),
    logScreenView: jest.fn().mockResolvedValue(undefined),
    forcePushData: jest.fn().mockResolvedValue(undefined),
    markAsOpened: jest.fn().mockResolvedValue(undefined),
    requestNotificationPermission: jest.fn().mockResolvedValue(true),
    getNotificationPermissionStatus: jest.fn().mockResolvedValue('DENIED'),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    getRecommendations: jest.fn().mockResolvedValue([{ productId: '1' }]),
    getAppInboxMessages: jest.fn().mockResolvedValue({ messages: [] }),
    logEcomEventProductViewed: jest.fn().mockResolvedValue(undefined),
    setInAppLifecycleCallback: jest.fn().mockResolvedValue(undefined),
    removeInAppLifecycleCallback: jest.fn().mockResolvedValue(undefined),
    pausePushInAppMessages: jest.fn().mockResolvedValue(undefined),
    setPushInAppMessagesPauseBehaviour: jest.fn().mockResolvedValue(undefined),
    setNotificationGroupingRule: jest.fn().mockResolvedValue(undefined),
    updatePushPermissionStatusAndroid: jest.fn().mockResolvedValue(undefined),
    __emitterAddListener: jest.fn(
      (_eventName: string, _listener: (event: unknown) => void) => ({
        remove: jest.fn(),
      })
    ),
  };

  return {
    NativeModules: {
      RetenoSdk,
    },
    TurboModuleRegistry: {
      get: jest.fn(() => RetenoSdk),
    },
    Platform: {
      OS: 'ios',
      select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
    },
    NativeEventEmitter: class {
      nativeModule: typeof RetenoSdk;

      constructor(nativeModule: typeof RetenoSdk) {
        this.nativeModule = nativeModule;
      }

      addListener(eventName: string, listener: (event: unknown) => void) {
        return this.nativeModule.__emitterAddListener(eventName, listener);
      }
    },
  };
});

import { NativeModules, Platform } from 'react-native';
import * as Reteno from '../index';

type MockRetenoSdk = {
  [K in
    | 'initialize'
    | 'setUserAttributes'
    | 'setMultiAccountUserAttributes'
    | 'logEvent'
    | 'logScreenView'
    | 'forcePushData'
    | 'markAsOpened'
    | 'requestNotificationPermission'
    | 'getNotificationPermissionStatus'
    | 'getInitialNotification'
    | 'getRecommendations'
    | 'getAppInboxMessages'
    | 'logEcomEventProductViewed'
    | 'setInAppLifecycleCallback'
    | 'removeInAppLifecycleCallback'
    | 'pausePushInAppMessages'
    | 'setPushInAppMessagesPauseBehaviour'
    | 'setNotificationGroupingRule'
    | 'updatePushPermissionStatusAndroid'
    | '__emitterAddListener']: jest.Mock;
};

const mockRetenoSdk = (NativeModules as unknown as { RetenoSdk: MockRetenoSdk })
  .RetenoSdk;

const setPlatform = (os: 'ios' | 'android') => {
  (Platform as { OS: string }).OS = os;
};

beforeEach(() => {
  jest.clearAllMocks();
  setPlatform('ios');
});

describe('initialize', () => {
  it('accepts a plain string as the API key', async () => {
    await Reteno.initialize('my-key');
    expect(mockRetenoSdk.initialize).toHaveBeenCalledWith({
      apiKey: 'my-key',
    });
  });

  it('trims the API key before forwarding it', async () => {
    await Reteno.initialize({ apiKey: '  my-key  ', isDebugMode: true });
    expect(mockRetenoSdk.initialize).toHaveBeenCalledWith({
      apiKey: 'my-key',
      isDebugMode: true,
    });
  });

  it('rejects when the API key is empty', async () => {
    await expect(Reteno.initialize('')).rejects.toThrow(
      'Missing argument: "apiKey"'
    );
    expect(mockRetenoSdk.initialize).not.toHaveBeenCalled();
  });

  it('rejects when the API key is only whitespace', async () => {
    await expect(Reteno.initialize('   ')).rejects.toThrow(
      'Missing argument: "apiKey"'
    );
    expect(mockRetenoSdk.initialize).not.toHaveBeenCalled();
  });
});

describe('setUserAttributes', () => {
  it('rejects (does not throw) when externalUserId is missing', async () => {
    // If this threw synchronously instead of rejecting, this assignment itself
    // would throw and fail the test before the matcher below ever runs.
    const promise = Reteno.setUserAttributes({ externalUserId: '', user: {} });
    await expect(promise).rejects.toThrow('Missing argument: "externalUserId"');
  });

  it('forwards a valid payload to the native module', async () => {
    const payload = { externalUserId: 'user-1', user: { userAttributes: {} } };
    await Reteno.setUserAttributes(payload);
    expect(mockRetenoSdk.setUserAttributes).toHaveBeenCalledWith(payload);
  });
});

describe('setMultiAccountUserAttributes', () => {
  it('rejects (does not throw) when externalUserId is missing', async () => {
    const promise = Reteno.setMultiAccountUserAttributes({
      externalUserId: '',
      user: {},
    });
    await expect(promise).rejects.toThrow('Missing argument: "externalUserId"');
  });

  it('forwards a valid payload to the native module', async () => {
    const payload = { externalUserId: 'user-1', user: {} };
    await Reteno.setMultiAccountUserAttributes(payload);
    expect(mockRetenoSdk.setMultiAccountUserAttributes).toHaveBeenCalledWith(
      payload
    );
  });
});

describe('forcePushData', () => {
  it('delegates to the native forcePushData method on iOS', async () => {
    setPlatform('ios');
    await Reteno.forcePushData();
    expect(mockRetenoSdk.forcePushData).toHaveBeenCalled();
    expect(mockRetenoSdk.logEvent).not.toHaveBeenCalled();
  });

  it('on Android, calls the native forcePushData method directly', async () => {
    setPlatform('android');
    await Reteno.forcePushData();
    expect(mockRetenoSdk.forcePushData).toHaveBeenCalled();
    expect(mockRetenoSdk.logEvent).not.toHaveBeenCalled();
  });
});

describe('markAsOpened', () => {
  it('on Android, sends the full id array and reports all ids as opened', async () => {
    setPlatform('android');
    const result = await Reteno.markAsOpened(['a', 'b']);
    expect(mockRetenoSdk.markAsOpened).toHaveBeenCalledWith(['a', 'b']);
    expect(result).toEqual({ ids: ['a', 'b'], status: 'OPENED' });
  });

  it('on iOS, sends the full id array', async () => {
    setPlatform('ios');
    const result = await Reteno.markAsOpened(['a', 'b']);
    expect(mockRetenoSdk.markAsOpened).toHaveBeenCalledWith(['a', 'b']);
    expect(result).toEqual({ ids: ['a', 'b'], status: 'OPENED' });
  });

  it('reports an empty status for an empty id list', async () => {
    setPlatform('ios');
    const result = await Reteno.markAsOpened([]);
    expect(result).toEqual({ ids: [], status: '' });
  });
});

describe('logScreenView', () => {
  it('delegates to native logScreenView with the screen name', async () => {
    await Reteno.logScreenView('Home');
    expect(mockRetenoSdk.logScreenView).toHaveBeenCalledWith('Home');
  });
});

describe('requestNotificationPermission', () => {
  it('delegates to the native module on Android', async () => {
    setPlatform('android');
    await expect(Reteno.requestNotificationPermission()).resolves.toBe(true);
    expect(mockRetenoSdk.requestNotificationPermission).toHaveBeenCalled();
  });

  it('rejects as unsupported on iOS instead of returning a fake value', async () => {
    setPlatform('ios');
    await expect(Reteno.requestNotificationPermission()).rejects.toThrow(
      'not supported on iOS'
    );
    expect(mockRetenoSdk.requestNotificationPermission).not.toHaveBeenCalled();
  });
});

describe('getNotificationPermissionStatus', () => {
  it('delegates to the native module on Android', async () => {
    setPlatform('android');
    await expect(Reteno.getNotificationPermissionStatus()).resolves.toBe(
      'DENIED'
    );
    expect(mockRetenoSdk.getNotificationPermissionStatus).toHaveBeenCalled();
  });

  it('rejects as unsupported on iOS instead of returning a fake value', async () => {
    setPlatform('ios');
    await expect(Reteno.getNotificationPermissionStatus()).rejects.toThrow(
      'not supported on iOS'
    );
    expect(
      mockRetenoSdk.getNotificationPermissionStatus
    ).not.toHaveBeenCalled();
  });
});

describe('getInitialNotification', () => {
  it('forwards the resolved value as-is', async () => {
    mockRetenoSdk.getInitialNotification.mockResolvedValueOnce({
      es_interaction_id: 'abc',
    });
    await expect(Reteno.getInitialNotification()).resolves.toEqual({
      es_interaction_id: 'abc',
    });
  });

  it('resolves to null when there is no launch notification', async () => {
    await expect(Reteno.getInitialNotification()).resolves.toBeNull();
  });
});

describe('getRecommendations', () => {
  it('returns the resolved array as-is', async () => {
    const payload = {
      recomVariantId: 'v1',
      productIds: ['1'],
      categoryId: 'c1',
      fields: ['productId'],
    };
    await expect(Reteno.getRecommendations(payload)).resolves.toEqual([
      { productId: '1' },
    ]);
  });

  it('defaults filters to an empty array when omitted, since the iOS bridge requires the key', async () => {
    const payload = {
      recomVariantId: 'v1',
      productIds: ['1'],
      categoryId: 'c1',
      fields: ['productId'],
    };
    await Reteno.getRecommendations(payload);
    expect(mockRetenoSdk.getRecommendations).toHaveBeenCalledWith({
      ...payload,
      filters: [],
    });
  });

  it('forwards filters as-is when provided', async () => {
    const payload = {
      recomVariantId: 'v1',
      productIds: ['1'],
      categoryId: 'c1',
      fields: ['productId'],
      filters: [{ name: 'color', values: ['red'] }],
    };
    await Reteno.getRecommendations(payload);
    expect(mockRetenoSdk.getRecommendations).toHaveBeenCalledWith(payload);
  });
});

describe('event manager', () => {
  it('subscribes a public event name to the mapped native event', () => {
    const listener = jest.fn();

    Reteno.addEventListener('pushReceived', listener);

    expect(mockRetenoSdk.__emitterAddListener).toHaveBeenCalledWith(
      'reteno-push-received',
      expect.any(Function)
    );
  });

  it('adapts the native emitter callback back to the typed public listener', () => {
    const listener = jest.fn();
    const event = { es_interaction_id: 'interaction-1' };

    Reteno.addEventListener('pushReceived', listener);
    const nativeListener =
      mockRetenoSdk.__emitterAddListener.mock.calls[0]?.[1];
    nativeListener(event);

    expect(listener).toHaveBeenCalledWith(event);
  });

  it('removes a listener by event and callback', () => {
    const listener = jest.fn();

    Reteno.addEventListener('pushClicked', listener);
    const nativeSubscription =
      mockRetenoSdk.__emitterAddListener.mock.results[0]?.value;

    Reteno.removeEventListener('pushClicked', listener);

    expect(nativeSubscription?.remove).toHaveBeenCalledTimes(1);
  });

  it('does not add a duplicate subscription for the same event and callback', () => {
    const listener = jest.fn();

    const first = Reteno.addEventListener('pushReceived', listener);
    const second = Reteno.addEventListener('pushReceived', listener);

    expect(second).toBe(first);
    expect(mockRetenoSdk.__emitterAddListener).toHaveBeenCalledTimes(1);
  });

  it('allows the same callback to subscribe to different events', () => {
    const listener = jest.fn();

    Reteno.addEventListener('pushReceived', listener);
    Reteno.addEventListener('pushClicked', listener);

    expect(mockRetenoSdk.__emitterAddListener).toHaveBeenCalledTimes(2);
    expect(mockRetenoSdk.__emitterAddListener).toHaveBeenNthCalledWith(
      1,
      'reteno-push-received',
      expect.any(Function)
    );
    expect(mockRetenoSdk.__emitterAddListener).toHaveBeenNthCalledWith(
      2,
      'reteno-push-clicked',
      expect.any(Function)
    );
  });

  it('old push received wrapper uses the new event manager', () => {
    const listener = jest.fn();

    Reteno.setOnRetenoPushReceivedListener(listener);

    expect(mockRetenoSdk.__emitterAddListener).toHaveBeenCalledWith(
      'reteno-push-received',
      expect.any(Function)
    );
  });

  it('returns a no-op subscription for unsupported platform events', () => {
    setPlatform('ios');
    const listener = jest.fn();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const subscription = Reteno.setOnRetenoPushDismissedListener(listener);
    subscription.remove();

    expect(mockRetenoSdk.__emitterAddListener).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      'Reteno event "pushDismissed" is only supported on android. Returning a no-op subscription.'
    );
    warnSpy.mockRestore();
  });

  it('subscribes Android-only events on Android', () => {
    setPlatform('android');
    const listener = jest.fn();

    Reteno.setOnRetenoPushDismissedListener(listener);

    expect(mockRetenoSdk.__emitterAddListener).toHaveBeenCalledWith(
      'reteno-push-dismissed',
      expect.any(Function)
    );
  });
});

describe('namespaces', () => {
  it('exposes user helpers without replacing the flat API', async () => {
    const payload = { externalUserId: 'user-1', user: {} };

    expect(Reteno.user.setAttributes).toBe(Reteno.setUserAttributes);
    await Reteno.user.setAttributes(payload);

    expect(mockRetenoSdk.setUserAttributes).toHaveBeenCalledWith(payload);
  });

  it('exposes generic event helpers through the events namespace', () => {
    const listener = jest.fn();

    expect(Reteno.events.addEventListener).toBe(Reteno.addEventListener);
    expect(Reteno.events.removeEventListener).toBe(Reteno.removeEventListener);
    expect(Reteno.events.initializeEventHandler).toBe(
      Reteno.initializeEventHandler
    );

    Reteno.events.addEventListener('pushReceived', listener);

    expect(mockRetenoSdk.__emitterAddListener).toHaveBeenCalledWith(
      'reteno-push-received',
      expect.any(Function)
    );
  });

  it('keeps push-triggered in-app pause names distinct from the general in-app pause API', () => {
    expect(Reteno.inApp.pauseMessages).toBe(Reteno.pauseInAppMessages);
    expect(Reteno.push.pauseTriggeredInAppMessages).toBe(
      Reteno.pausePushInAppMessages
    );
    expect(Reteno.push.pauseTriggeredInAppMessages).not.toBe(
      Reteno.inApp.pauseMessages
    );
    expect('pauseInAppMessages' in Reteno.push).toBe(false);
    expect('addEventListener' in Reteno.push).toBe(false);
  });

  it('exposes inbox helpers through concise names', async () => {
    const payload = { page: 1, pageSize: 10 };

    expect(Reteno.inbox.getMessages).toBe(Reteno.getAppInboxMessages);
    await Reteno.inbox.getMessages(payload);

    expect(mockRetenoSdk.getAppInboxMessages).toHaveBeenCalledWith(payload);
  });

  it('exposes ecommerce helpers through concise names', async () => {
    const payload = {
      product: {
        productId: 'product-1',
        price: 10,
        isInStock: true,
      },
      currencyCode: 'USD',
    };

    expect(Reteno.ecommerce.productViewed).toBe(
      Reteno.logEcomEventProductViewed
    );
    await Reteno.ecommerce.productViewed(payload);

    expect(mockRetenoSdk.logEcomEventProductViewed).toHaveBeenCalledWith(
      payload
    );
  });
});

describe('in-app lifecycle callbacks', () => {
  it('setInAppLifecycleCallback delegates to native on both platforms and returns its promise', async () => {
    setPlatform('ios');
    await expect(Reteno.setInAppLifecycleCallback()).resolves.toBeUndefined();
    expect(mockRetenoSdk.setInAppLifecycleCallback).toHaveBeenCalled();

    setPlatform('android');
    await expect(Reteno.setInAppLifecycleCallback()).resolves.toBeUndefined();
    expect(mockRetenoSdk.setInAppLifecycleCallback).toHaveBeenCalledTimes(2);
  });

  it('removeInAppLifecycleCallback delegates to native on Android', async () => {
    setPlatform('android');
    await expect(
      Reteno.removeInAppLifecycleCallback()
    ).resolves.toBeUndefined();
    expect(mockRetenoSdk.removeInAppLifecycleCallback).toHaveBeenCalled();
  });

  it('removeInAppLifecycleCallback resolves without calling native on iOS', async () => {
    setPlatform('ios');
    await expect(
      Reteno.removeInAppLifecycleCallback()
    ).resolves.toBeUndefined();
    expect(mockRetenoSdk.removeInAppLifecycleCallback).not.toHaveBeenCalled();
  });
});

describe('Android-only fire-and-forget commands', () => {
  it('pausePushInAppMessages delegates to native on Android, no-ops on iOS', async () => {
    setPlatform('android');
    await expect(Reteno.pausePushInAppMessages(true)).resolves.toBeUndefined();
    expect(mockRetenoSdk.pausePushInAppMessages).toHaveBeenCalledWith(true);

    setPlatform('ios');
    await expect(Reteno.pausePushInAppMessages(true)).resolves.toBeUndefined();
    expect(mockRetenoSdk.pausePushInAppMessages).toHaveBeenCalledTimes(1);
  });

  it('setPushInAppMessagesPauseBehaviour delegates to native on Android, no-ops on iOS', async () => {
    setPlatform('android');
    await expect(
      Reteno.setPushInAppMessagesPauseBehaviour('SKIP_IN_APPS')
    ).resolves.toBeUndefined();
    expect(
      mockRetenoSdk.setPushInAppMessagesPauseBehaviour
    ).toHaveBeenCalledWith('SKIP_IN_APPS');

    setPlatform('ios');
    await expect(
      Reteno.setPushInAppMessagesPauseBehaviour('SKIP_IN_APPS')
    ).resolves.toBeUndefined();
    expect(
      mockRetenoSdk.setPushInAppMessagesPauseBehaviour
    ).toHaveBeenCalledTimes(1);
  });

  it('updatePushPermissionStatusAndroid delegates to native on Android, no-ops on iOS', async () => {
    setPlatform('android');
    await expect(
      Reteno.updatePushPermissionStatusAndroid()
    ).resolves.toBeUndefined();
    expect(mockRetenoSdk.updatePushPermissionStatusAndroid).toHaveBeenCalled();

    setPlatform('ios');
    await expect(
      Reteno.updatePushPermissionStatusAndroid()
    ).resolves.toBeUndefined();
    expect(
      mockRetenoSdk.updatePushPermissionStatusAndroid
    ).toHaveBeenCalledTimes(1);
  });
});

describe('setNotificationGroupingRule', () => {
  it('is exposed under the push namespace with a concise name', () => {
    expect(Reteno.push.setGroupingRule).toBe(
      Reteno.setNotificationGroupingRule
    );
  });

  it('normalizes a payload key rule on Android', async () => {
    setPlatform('android');
    await Reteno.setNotificationGroupingRule({ payloadKey: '  chatId  ' });

    expect(mockRetenoSdk.setNotificationGroupingRule).toHaveBeenCalledWith({
      payloadKey: 'chatId',
    });
  });

  it('normalizes a constant group id rule on Android', async () => {
    setPlatform('android');
    await Reteno.setNotificationGroupingRule({ groupId: '  messages  ' });

    expect(mockRetenoSdk.setNotificationGroupingRule).toHaveBeenCalledWith({
      groupId: 'messages',
    });
  });

  it('passes null through to disable grouping', async () => {
    setPlatform('android');
    await Reteno.setNotificationGroupingRule(null);

    expect(mockRetenoSdk.setNotificationGroupingRule).toHaveBeenCalledWith(
      null
    );
  });

  it('rejects a rule with neither payloadKey nor groupId', async () => {
    setPlatform('android');
    await expect(
      Reteno.setNotificationGroupingRule({ payloadKey: '  ' } as never)
    ).rejects.toThrow(
      'Invalid argument: provide exactly one of payloadKey or groupId'
    );
  });

  it('rejects a rule with both payloadKey and groupId', async () => {
    setPlatform('android');
    await expect(
      Reteno.setNotificationGroupingRule({
        payloadKey: 'chatId',
        groupId: 'messages',
      } as never)
    ).rejects.toThrow(
      'Invalid argument: provide exactly one of payloadKey or groupId'
    );
  });

  it('no-ops on iOS without calling native', async () => {
    setPlatform('ios');
    mockRetenoSdk.setNotificationGroupingRule.mockClear();

    await expect(
      Reteno.setNotificationGroupingRule({ groupId: 'messages' })
    ).resolves.toBeUndefined();
    expect(mockRetenoSdk.setNotificationGroupingRule).not.toHaveBeenCalled();
  });
});
