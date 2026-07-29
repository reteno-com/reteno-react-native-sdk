const mockSetNotificationGroupingRule = jest.fn(() => Promise.resolve());

export {};

jest.mock('react-native', () => ({
  DeviceEventEmitter: { addListener: jest.fn() },
  NativeEventEmitter: jest.fn(),
  NativeModules: new Proxy(
    {},
    {
      get: (_target, property) =>
        property === 'RetenoSdk'
          ? { setNotificationGroupingRule: mockSetNotificationGroupingRule }
          : undefined,
    }
  ),
  Platform: {
    OS: 'android',
    select: jest.fn(({ default: defaultValue }) => defaultValue),
  },
}));

const { setNotificationGroupingRule } =
  require('../index') as typeof import('../index');

describe('setNotificationGroupingRule', () => {
  beforeEach(() => {
    mockSetNotificationGroupingRule.mockClear();
  });

  it('normalizes a payload key rule', async () => {
    await setNotificationGroupingRule({ payloadKey: '  chatId  ' });

    expect(mockSetNotificationGroupingRule).toHaveBeenCalledWith({
      payloadKey: 'chatId',
    });
  });

  it('normalizes a constant group id rule', async () => {
    await setNotificationGroupingRule({ groupId: '  messages  ' });

    expect(mockSetNotificationGroupingRule).toHaveBeenCalledWith({
      groupId: 'messages',
    });
  });

  it('passes null to disable grouping', async () => {
    await setNotificationGroupingRule(null);

    expect(mockSetNotificationGroupingRule).toHaveBeenCalledWith(null);
  });

  it('rejects an empty rule', async () => {
    await expect(
      setNotificationGroupingRule({ payloadKey: '  ' })
    ).rejects.toThrow(
      'Invalid argument: provide exactly one of payloadKey or groupId'
    );
  });

  it('rejects a rule containing both modes', async () => {
    await expect(
      setNotificationGroupingRule({
        payloadKey: 'chatId',
        groupId: 'messages',
      } as unknown as Parameters<typeof setNotificationGroupingRule>[0])
    ).rejects.toThrow(
      'Invalid argument: provide exactly one of payloadKey or groupId'
    );
  });
});
