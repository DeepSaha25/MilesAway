import {create} from 'zustand';
import {createJSONStorage, devtools, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiClient from '../services/apiClient';
import AuthService, {
  LoginPayload,
  SignupPayload,
  AuthResponse,
} from '../services/authService';
import {GUEST_TOKEN, guestUser} from '../services/guestSession';

type AuthUser = Record<string, any> | null;

interface AuthState {
  token: string | null;
  user: AuthUser;
  hydrated: boolean;
  bootstrap: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  loginAsGuest: () => Promise<AuthResponse>;
  signup: (payload: SignupPayload) => Promise<void>;
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
              const guestResponse = await AuthService.loginAsGuest();
              set({
                token: guestResponse.token,
                user: guestResponse.user,
                hydrated: true,
              });
              return;
            }

            set({
              token: ApiClient.token || GUEST_TOKEN,
              user: storedUser,
              hydrated: true,
            });
          } catch {
            ApiClient.token = GUEST_TOKEN;
            set({
              token: GUEST_TOKEN,
              user: guestUser,
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
          await AuthService.signup(payload);
        },
        logout: async () => {
          await AuthService.logout();
          const guestResponse = await AuthService.loginAsGuest();
          set({
            token: guestResponse.token,
            user: guestResponse.user,
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
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
