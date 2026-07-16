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
    forcePushData: jest.fn().mockResolvedValue(undefined),
    markAsOpened: jest.fn().mockResolvedValue(undefined),
    requestNotificationPermission: jest.fn().mockResolvedValue(true),
    getNotificationPermissionStatus: jest.fn().mockResolvedValue('DENIED'),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    getRecommendations: jest.fn().mockResolvedValue([{ productId: '1' }]),
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
    | 'forcePushData'
    | 'markAsOpened'
    | 'requestNotificationPermission'
    | 'getNotificationPermissionStatus'
    | 'getInitialNotification'
    | 'getRecommendations'
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
  it('on iOS, forwards via logEvent with forcePush=true', async () => {
    setPlatform('ios');
    await Reteno.forcePushData();
    expect(mockRetenoSdk.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: '',
        parameters: [],
        forcePush: true,
      })
    );
    expect(mockRetenoSdk.forcePushData).not.toHaveBeenCalled();
  });

  it('on Android, calls the native forcePushData method directly', async () => {
    setPlatform('android');
    await Reteno.forcePushData();
    expect(mockRetenoSdk.forcePushData).toHaveBeenCalled();
    expect(mockRetenoSdk.logEvent).not.toHaveBeenCalled();
  });
});

describe('markAsOpened', () => {
  it('on Android, sends only the first id and reports all ids as opened', async () => {
    setPlatform('android');
    const result = await Reteno.markAsOpened(['a', 'b']);
    expect(mockRetenoSdk.markAsOpened).toHaveBeenCalledWith('a');
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
  it('logs a screenView event with the screen name', async () => {
    await Reteno.logScreenView('Home');
    expect(mockRetenoSdk.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'screenView',
        parameters: [{ name: 'screenView', value: 'Home' }],
      })
    );
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
