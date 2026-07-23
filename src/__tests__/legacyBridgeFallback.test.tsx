// Simulates an old-architecture / no-TurboModule-support runtime: TurboModuleRegistry.get()
// returns null (the JSI proxy path is unavailable), but the classic NativeModules.RetenoSdk
// bridge is still registered — exactly what happens when New Architecture is off or the
// TurboModule hasn't been picked up. `NativeRetenoSdk ?? NativeModules.RetenoSdk` in
// src/index.ts must fall back to the legacy module and keep working, not fall through to the
// LINKING_ERROR proxy.
//
// The mock is constructed *inside* the factory (self-contained), same reason as in
// index.test.tsx: jest.mock factories run before any module-scoped `const` declared above
// them, so a mock object defined outside this factory would still be `undefined` when the
// factory actually runs.
jest.mock('react-native', () => ({
  NativeModules: {
    RetenoSdk: {
      initialize: jest.fn().mockResolvedValue(true),
    },
  },
  TurboModuleRegistry: {
    get: jest.fn(() => null),
  },
  Platform: {
    OS: 'ios',
    select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
  },
  NativeEventEmitter: class {
    addListener = jest.fn(() => ({ remove: jest.fn() }));
  },
}));

import { NativeModules } from 'react-native';
import * as Reteno from '../index';

const mockLegacyRetenoSdk = (
  NativeModules as unknown as {
    RetenoSdk: { initialize: jest.Mock };
  }
).RetenoSdk;

describe('legacy bridge fallback (TurboModule unavailable)', () => {
  it('falls back to NativeModules.RetenoSdk and functions normally', async () => {
    await expect(Reteno.initialize('my-key')).resolves.toBe(true);
    expect(mockLegacyRetenoSdk.initialize).toHaveBeenCalledWith({
      apiKey: 'my-key',
    });
  });
});
