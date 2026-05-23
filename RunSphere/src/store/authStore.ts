import {create} from 'zustand';
import {createJSONStorage, devtools, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiClient from '../services/apiClient';
import UserService from '../services/userService';
import AuthService, {
  LoginPayload,
  SignupPayload,
  AuthResponse,
} from '../services/authService';
import {GUEST_TOKEN, isGuestUser} from '../services/guestSession';

type AuthUser = Record<string, any> | null;

interface AuthState {
  token: string | null;
  user: AuthUser;
  hydrated: boolean;
  bootstrap: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  loginAsGuest: () => Promise<AuthResponse>;
  signup: (payload: SignupPayload) => Promise<AuthResponse>;
  resetPassword: (payload: {
    token: string;
    password: string;
    confirmPassword: string;
  }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    devtools(
      (set, get) => ({
        token: null,
        user: null,
        hydrated: false,
        bootstrap: async () => {
          try {
            await ApiClient.init();
            const storedUser = await ApiClient.getStoredUser();

            if (!storedUser) {
              set({
                token: null,
                user: null,
                hydrated: true,
              });
              return;
            }

            if (isGuestUser(storedUser)) {
              await ApiClient.clearAuth();
              set({
                token: null,
                user: null,
                hydrated: true,
              });
              return;
            }

            const token = ApiClient.token || (isGuestUser(storedUser) ? GUEST_TOKEN : null);

            if (!token) {
              await ApiClient.clearAuth();
            }

            if (token && !isGuestUser(storedUser)) {
              try {
                const profileRes = await UserService.getMe();
                const profile = profileRes.data;
                await ApiClient.setAuth(token, profile);
                set({
                  token,
                  user: profile,
                  hydrated: true,
                });
                return;
              } catch {
                await ApiClient.clearAuth();
                set({
                  token: null,
                  user: null,
                  hydrated: true,
                });
                return;
              }
            }

            set({
              token,
              user: token ? storedUser : null,
              hydrated: true,
            });
          } catch {
            ApiClient.token = null;
            set({
              token: null,
              user: null,
              hydrated: true,
            });
          }
        },
        login: async payload => {
          const response = await AuthService.login(payload);
          set({
            token: response.token,
            user: response.user,
            hydrated: true,
          });
          return response;
        },
        loginAsGuest: async () => {
          const response = await AuthService.loginAsGuest();
          set({
            token: response.token,
            user: response.user,
            hydrated: true,
          });
          return response;
        },
        signup: async payload => {
          const response = await AuthService.signup(payload);
          set({
            token: response.token,
            user: response.user,
            hydrated: true,
          });
          return response;
        },
        resetPassword: async payload => {
          const response = await AuthService.resetPassword(payload);
          set({
            token: response.token,
            user: response.user,
            hydrated: true,
          });
          return response;
        },
        logout: async () => {
          await AuthService.logout();
          set({
            token: null,
            user: null,
            hydrated: true,
          });
        },
        setUser: async user => {
          const token = get().token;
          if (token && user) {
            await ApiClient.setAuth(token, user);
          }
          set({user});
        },
      }),
      {name: 'milesaway-auth-store'},
    ),
    {
      name: 'milesaway-auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        token: isGuestUser(state.user) ? null : state.token,
        user: isGuestUser(state.user) ? null : state.user,
      }),
    },
  ),
);
