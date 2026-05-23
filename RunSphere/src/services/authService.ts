import ApiClient from './apiClient';
import {GUEST_TOKEN, guestUser} from './guestSession';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  token: string;
  user: any;
}

const AuthService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const data = await ApiClient.post<AuthResponse>('/auth/login', payload);
    await ApiClient.setAuth(data.token, data.user);
    return data;
  },

  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const data = await ApiClient.post<AuthResponse>('/auth/signup', payload);
    await ApiClient.setAuth(data.token, data.user);
    return data;
  },

  async logout() {
    await ApiClient.clearAuth();
  },

  async loginAsGuest(): Promise<AuthResponse> {
    const response = {
      status: 'success',
      message: 'Guest session started',
      token: GUEST_TOKEN,
      user: guestUser,
    };

    await ApiClient.setAuth(response.token, response.user);
    return response;
  },

  async isLoggedIn(): Promise<boolean> {
    await ApiClient.init();
    return !!ApiClient.token;
  },

  async getStoredUser() {
    return ApiClient.getStoredUser();
  },
};

export default AuthService;
