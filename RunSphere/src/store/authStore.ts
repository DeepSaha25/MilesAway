import {create} from 'zustand';
import {createJSONStorage, devtools, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiClient, {ApiError} from '../services/apiClient';
import UserService from '../services/userService';
import AuthService, {
  LoginPayload,
  SignupPayload,
  AuthResponse,
} from '../services/authService';
import {GUEST_TOKEN, isGuestUser} from '../services/guestSession';

type AuthUser = Record<string, any> | null;

const AUTH_STORE_KEY = 'milesaway-auth-store';

const getPersistedAuthToken = async () => {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.state?.token || null;
  } catch (error) {
    throw new ApiError(
      'Secure storage read token failed.',
      0,
      undefined,
      {
        code: 'STORAGE_FAILURE',
        data: {
          operation: 'read persisted auth token',
          message:
            error instanceof Error ? error.message : 'Storage operation failed',
        },
      },
    );
  }
};

const isStorageFailure = (error: unknown) =>
  error instanceof ApiError && error.code === 'STORAGE_FAILURE';

const getStorageFailureMessage = (error: unknown) =>
  error instanceof Error && error.message
    ? error.message
    : 'Secure storage failed. Please restart the app and try again.';

interface AuthState {
  token: string | null;
  user: AuthUser;
  hydrated: boolean;
  storageFailureError: string | null;
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
  deleteAccount: (currentPassword: string) => Promise<void>;
  setUser: (user: AuthUser) => Promise<void>;
}

const clearLocalDomainState = async () => {
  const {useRunStore} = await import('./runStore');
  const {useUserStore} = await import('./userStore');
  const {useLeaderboardStore} = await import('./leaderboardStore');
  const {useGoalStore} = await import('./goalStore');
  const {discardTelemetrySession} = await import('../services/telemetrySessionStorage');

  const activeRun = useRunStore.getState().clientRunId;
  useRunStore.getState().resetRun();
  useUserStore.getState().reset();
  useLeaderboardStore.getState().reset();
  useGoalStore.setState({weeklyHoursGoal: 6});
  await discardTelemetrySession(activeRun);
};

export const useAuthStore = create<AuthState>()(
  persist(
    devtools(
      (set, get) => ({
        token: null,
        user: null,
        hydrated: false,
        storageFailureError: null,
        bootstrap: async () => {
          try {
            await ApiClient.init();
            const storedUser = await ApiClient.getStoredUser();

            if (!storedUser) {
              set({
                token: null,
                user: null,
                hydrated: true,
                storageFailureError: null,
              });
              return;
            }

            if (isGuestUser(storedUser)) {
              await ApiClient.clearAuth();
              set({
                token: null,
                user: null,
                hydrated: true,
                storageFailureError: null,
              });
              return;
            }

            const persistedToken = get().token || (await getPersistedAuthToken());
            const token =
              ApiClient.token ||
              (isGuestUser(storedUser) ? GUEST_TOKEN : persistedToken);

            if (!token) {
              await ApiClient.clearAuth();
            }

            if (token && !isGuestUser(storedUser)) {
              try {
                await ApiClient.setAuth(token, storedUser);
                const profileRes = await UserService.getMe();
                const profile = profileRes.data;
                await ApiClient.setAuth(token, profile);
                set({
                  token,
                  user: profile,
                  hydrated: true,
                  storageFailureError: null,
                });
                return;
              } catch (error) {
                if (isStorageFailure(error)) {
                  set({
                    token: null,
                    user: null,
                    hydrated: true,
                    storageFailureError: getStorageFailureMessage(error),
                  });
                  return;
                }

                await ApiClient.clearAuth();
                set({
                  token: null,
                  user: null,
                  hydrated: true,
                  storageFailureError: null,
                });
                return;
              }
            }

            set({
              token,
              user: token ? storedUser : null,
              hydrated: true,
              storageFailureError: null,
            });
          } catch (error) {
            ApiClient.token = null;
            set({
              token: null,
              user: null,
              hydrated: true,
              storageFailureError: isStorageFailure(error)
                ? getStorageFailureMessage(error)
                : null,
            });
          }
        },
        login: async payload => {
          try {
            const response = await AuthService.login(payload);
            set({
              token: response.token,
              user: response.user,
              hydrated: true,
              storageFailureError: null,
            });
            return response;
          } catch (error) {
            if (isStorageFailure(error)) {
              set({storageFailureError: getStorageFailureMessage(error)});
            }
            throw error;
          }
        },
        loginAsGuest: async () => {
          try {
            const response = await AuthService.loginAsGuest();
            set({
              token: response.token,
              user: response.user,
              hydrated: true,
              storageFailureError: null,
            });
            return response;
          } catch (error) {
            if (isStorageFailure(error)) {
              set({storageFailureError: getStorageFailureMessage(error)});
            }
            throw error;
          }
        },
        signup: async payload => {
          try {
            const response = await AuthService.signup(payload);
            set({
              token: response.token,
              user: response.user,
              hydrated: true,
              storageFailureError: null,
            });
            return response;
          } catch (error) {
            if (isStorageFailure(error)) {
              set({storageFailureError: getStorageFailureMessage(error)});
            }
            throw error;
          }
        },
        resetPassword: async payload => {
          try {
            const response = await AuthService.resetPassword(payload);
            set({
              token: response.token,
              user: response.user,
              hydrated: true,
              storageFailureError: null,
            });
            return response;
          } catch (error) {
            if (isStorageFailure(error)) {
              set({storageFailureError: getStorageFailureMessage(error)});
            }
            throw error;
          }
        },
        logout: async () => {
          try {
            await AuthService.logout();
            set({
              token: null,
              user: null,
              hydrated: true,
              storageFailureError: null,
            });
          } catch (error) {
            if (isStorageFailure(error)) {
              set({storageFailureError: getStorageFailureMessage(error)});
            }
            throw error;
          }
        },
        deleteAccount: async currentPassword => {
          try {
            await UserService.deleteAccount(currentPassword);
            await clearLocalDomainState();
            await ApiClient.clearAuth();
            set({
              token: null,
              user: null,
              hydrated: true,
              storageFailureError: null,
            });
          } catch (error) {
            if (isStorageFailure(error)) {
              set({storageFailureError: getStorageFailureMessage(error)});
            }
            throw error;
          }
        },
        setUser: async user => {
          const token = get().token;
          try {
            if (token && user) {
              await ApiClient.setAuth(token, user);
            }
            set({user, storageFailureError: null});
          } catch (error) {
            if (isStorageFailure(error)) {
              set({storageFailureError: getStorageFailureMessage(error)});
            }
            throw error;
          }
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
