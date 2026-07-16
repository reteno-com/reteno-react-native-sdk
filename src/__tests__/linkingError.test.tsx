// Simulates the package not being linked: NativeModules.RetenoSdk is absent, so
// src/index.ts falls back to a Proxy that throws on any property access.
jest.mock('react-native', () => ({
  NativeModules: {},
  Platform: {
    OS: 'ios',
    select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
  },
  DeviceEventEmitter: { addListener: jest.fn(() => ({ remove: jest.fn() })) },
  NativeEventEmitter: class {
    addListener = jest.fn(() => ({ remove: jest.fn() }));
  },
}));

import * as Reteno from '../index';

describe('unlinked native module', () => {
  it('throws synchronously (not a rejected promise) when calling into the native module', () => {
    // Accessing a property on the LINKING_ERROR proxy throws before any Promise
    // machinery gets involved, so this is a sync throw out of `initialize()`,
    // even though the function is typed to return a Promise.
    expect(() => Reteno.initialize('my-key')).toThrow(
      /doesn't seem to be linked/
    );
  });
});
