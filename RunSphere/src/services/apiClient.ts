import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {API_BASE_URL} from '../config/api';
import {GUEST_TOKEN} from './guestSession';

const TOKEN_KEY = 'milesaway_token';
const USER_KEY = '@milesaway_user';

export interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

export type ApiErrorMetadata<TError = unknown> = {
  data?: TError;
  endpoint?: string;
  method?: string;
  code?: string;
};

type LogMetadata = {
  method?: string;
  endpoint?: string;
  status?: number;
  message?: string;
  tokenPresent?: boolean;
  code?: string;
};

const isDev = () =>
  typeof __DEV__ !== 'undefined' ? Boolean(__DEV__) : false;

const toSafeMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const createStorageError = (operation: string, error: unknown) =>
  new ApiError(
    `Secure storage ${operation} failed.`,
    0,
    undefined,
    {
      code: 'STORAGE_FAILURE',
      data: {operation, message: toSafeMessage(error, 'Storage operation failed')},
    },
  );

const devLogError = (label: string, metadata: LogMetadata) => {
  if (!isDev()) {
    return;
  }

  console.error(label, metadata);
};

const devLogInfo = (label: string, metadata: LogMetadata) => {
  if (!isDev()) {
    return;
  }

  console.log(label, metadata);
};

class ApiClient {
  static token: string | null = null;
  static onUnauthorized: (() => void | Promise<void>) | null = null;

  static async init() {
    try {
      this.token = (await SecureStore.getItemAsync(TOKEN_KEY)) || null;
      devLogInfo('ApiClient initialized', {tokenPresent: !!this.token});
    } catch (error) {
      this.token = null;
      throw createStorageError('read token', error);
    }
  }

  static async setAuth(token: string, user: any) {
    this.token = token;

    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      throw createStorageError('write auth session', error);
    }
  }

  static async clearAuth() {
    this.token = null;

    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      throw createStorageError('clear auth session', error);
    }
  }

  static setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
    this.onUnauthorized = handler;
  }

  static async getStoredUser() {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      throw createStorageError('read stored user', error);
    }
  }

  private static getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  static async request<T = any>(
    method: string,
    endpoint: string,
    body?: any,
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (error) {
      const message =
        'Network error. Please check your internet connection and try again.';
      devLogError('ApiClient network error', {
        method,
        endpoint,
        message: toSafeMessage(error, message),
        tokenPresent: !!this.token,
      });

      throw new ApiError(message, 0, undefined, {
        endpoint,
        method,
        code: 'NETWORK_ERROR',
        data: {message: toSafeMessage(error, message)},
      });
    }

    const rawText = await response.text();
    let data: any = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = {message: rawText || response.statusText || 'Request failed'};
    }

    if (response.status === 401 && this.token !== GUEST_TOKEN) {
      await this.clearAuth();
      await this.onUnauthorized?.();
    }

    if (!response.ok) {
      const message = data?.message || response.statusText || 'Request failed';
      devLogError('ApiClient response error', {
        method,
        endpoint,
        status: response.status,
        message,
        tokenPresent: !!this.token,
      });

      throw new ApiError(message, response.status, data, {
        endpoint,
        method,
        data,
      });
    }

    return data;
  }

  static get<T = any>(endpoint: string) {
    return this.request<T>('GET', endpoint);
  }

  static post<T = any>(endpoint: string, body?: any) {
    return this.request<T>('POST', endpoint, body);
  }

  static put<T = any>(endpoint: string, body?: any) {
    return this.request<T>('PUT', endpoint, body);
  }

  static delete<T = any>(endpoint: string) {
    return this.request<T>('DELETE', endpoint);
  }

  static deleteWithBody<T = any>(endpoint: string, body?: any) {
    return this.request<T>('DELETE', endpoint, body);
  }
}

class ApiError<TError = unknown> extends Error {
  status: number;
  data?: TError;
  endpoint?: string;
  method?: string;
  code?: string;

  constructor(
    message: string,
    status: number,
    data?: TError,
    metadata: ApiErrorMetadata<TError> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = metadata.data ?? data;
    this.endpoint = metadata.endpoint;
    this.method = metadata.method;
    this.code = metadata.code;
  }
}

export {ApiClient, ApiError, API_BASE_URL as BASE_URL};
export default ApiClient;
