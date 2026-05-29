import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import ApiClient, {ApiError} from '../src/services/apiClient';

const setDevFlag = (value: boolean) => {
  Object.defineProperty(globalThis, '__DEV__', {
    configurable: true,
    value,
  });
};

const mockFetch = (implementation: jest.Mock) => {
  globalThis.fetch = implementation as unknown as typeof fetch;
};

describe('ApiClient security behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ApiClient.token = null;
    setDevFlag(true);
  });

  it('logs sanitized network metadata in development without auth headers or body', async () => {
    ApiClient.token = 'secret-jwt-token';
    mockFetch(jest.fn(async () => {
      throw new Error('socket closed');
    }));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(
      ApiClient.post('/auth/login', {
        email: 'runner@example.com',
        password: 'super-secret-password',
      }),
    ).rejects.toBeInstanceOf(ApiError);

    const logged = JSON.stringify(consoleSpy.mock.calls);
    expect(logged).toContain('ApiClient network error');
    expect(logged).toContain('/auth/login');
    expect(logged).toContain('tokenPresent');
    expect(logged).not.toContain('secret-jwt-token');
    expect(logged).not.toContain('Authorization');
    expect(logged).not.toContain('super-secret-password');

    consoleSpy.mockRestore();
  });

  it('throws typed sanitized API errors for non-OK responses', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockFetch(
      jest.fn(async () => ({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => JSON.stringify({message: 'Server unavailable'}),
      })),
    );

    await expect(ApiClient.get('/run/stats')).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      message: 'Server unavailable',
      endpoint: '/run/stats',
      method: 'GET',
      data: {message: 'Server unavailable'},
    });

    consoleSpy.mockRestore();
  });

  it('propagates SecureStore failures from setAuth', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error('secure store unavailable'),
    );

    await expect(ApiClient.setAuth('token', {_id: 'user-1'})).rejects.toMatchObject({
      name: 'ApiError',
      code: 'STORAGE_FAILURE',
      message: 'Secure storage write auth session failed.',
    });
  });

  it('does not log API errors when development logging is disabled', async () => {
    setDevFlag(false);
    mockFetch(jest.fn(async () => {
      throw new Error('offline');
    }));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(ApiClient.get('/run/stats')).rejects.toBeInstanceOf(ApiError);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('stores auth token and user when storage succeeds', async () => {
    await ApiClient.setAuth('token', {_id: 'user-1'});

    expect(SecureStore.setItemAsync).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
