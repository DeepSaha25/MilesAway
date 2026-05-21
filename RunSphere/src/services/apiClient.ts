import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {API_BASE_URL} from '../config/api';
import {GUEST_TOKEN} from './guestSession';

const TOKEN_KEY = '@runsphere_token';
const USER_KEY = '@runsphere_user';

class ApiClient {
  static token: string | null = null;
  static onUnauthorized: (() => void | Promise<void>) | null = null;

  static async init() {
    try {
      this.token = (await SecureStore.getItemAsync(TOKEN_KEY)) || null;
    } catch {}
  }

  static async setAuth(token: string, user: any) {
    this.token = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static async clearAuth() {
    this.token = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  }

  static setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
    this.onUnauthorized = handler;
  }

  static async getStoredUser() {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
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

    const response = await fetch(url, options);
    const rawText = await response.text();
    const data = rawText ? JSON.parse(rawText) : {};

    if (response.status === 401 && this.token !== GUEST_TOKEN) {
      await this.clearAuth();
      await this.onUnauthorized?.();
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Request failed',
        response.status,
        data,
      );
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
}

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export {ApiClient, ApiError, API_BASE_URL as BASE_URL};
export default ApiClient;
