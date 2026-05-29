import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import ApiClient from '../src/services/apiClient';
import {useAuthStore} from '../src/store/authStore';

const mockFetch = (implementation: jest.Mock) => {
  globalThis.fetch = implementation as unknown as typeof fetch;
};

const successfulAuthResponse = {
  status: 'success',
  message: 'Logged in',
  token: 'token-1',
  user: {_id: 'user-1', name: 'Runner'},
};

describe('authStore storage failure exposure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ApiClient.token = null;
    useAuthStore.setState({
      token: null,
      user: null,
      hydrated: false,
      storageFailureError: null,
    });
    mockFetch(
      jest.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(successfulAuthResponse),
      })),
    );
  });

  it('bootstrap exposes token restore storage failures', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error('secure read failed'),
    );

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      user: null,
      hydrated: true,
      storageFailureError: 'Secure storage read token failed.',
    });
  });

  it('login propagates token persistence failure and stores storageFailureError', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error('secure write failed'),
    );

    await expect(
      useAuthStore.getState().login({
        email: 'runner@example.com',
        password: 'password',
      }),
    ).rejects.toMatchObject({
      code: 'STORAGE_FAILURE',
    });

    expect(useAuthStore.getState().storageFailureError).toBe(
      'Secure storage write auth session failed.',
    );
  });

  it('logout propagates clear-storage failure and stores storageFailureError', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error('secure delete failed'),
    );

    await expect(useAuthStore.getState().logout()).rejects.toMatchObject({
      code: 'STORAGE_FAILURE',
    });

    expect(useAuthStore.getState().storageFailureError).toBe(
      'Secure storage clear auth session failed.',
    );
  });

  it('successful login clears previous storageFailureError', async () => {
    useAuthStore.setState({storageFailureError: 'Previous storage issue'});

    await useAuthStore.getState().login({
      email: 'runner@example.com',
      password: 'password',
    });

    expect(useAuthStore.getState()).toMatchObject({
      token: successfulAuthResponse.token,
      user: successfulAuthResponse.user,
      hydrated: true,
      storageFailureError: null,
    });
  });

  it('setUser exposes AsyncStorage persistence failures', async () => {
    useAuthStore.setState({token: 'token-1', user: {_id: 'user-1'}});
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error('async storage write failed'),
    );

    await expect(
      useAuthStore.getState().setUser({_id: 'user-1', name: 'Updated'}),
    ).rejects.toMatchObject({
      code: 'STORAGE_FAILURE',
    });

    expect(useAuthStore.getState().storageFailureError).toBe(
      'Secure storage write auth session failed.',
    );
  });
});
