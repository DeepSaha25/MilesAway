import {Platform} from 'react-native';

declare const __DEV__: boolean;
declare const process:
  | {
      env?: {
        EXPO_PUBLIC_MILESAWAY_API_URL?: string;
        EXPO_PUBLIC_MILESAWAY_USE_LOCAL_API?: string;
        MILESAWAY_API_URL?: string;
        MILESAWAY_USE_LOCAL_API?: string;
      };
    }
  | undefined;

const getConfiguredUrl = () => {
  const globalUrl = (globalThis as any).MILESAWAY_API_URL;
  const envUrl =
    typeof process !== 'undefined'
      ? process?.env?.EXPO_PUBLIC_MILESAWAY_API_URL ||
        process?.env?.MILESAWAY_API_URL
      : undefined;

  return (envUrl || globalUrl || '').trim();
};

const PRODUCTION_API_URL = 'https://runshphere-production.up.railway.app/api';

const getLocalUrl = () =>
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'
    : 'http://localhost:5000/api';

const shouldUseLocalApi = () => {
  const globalUseLocal = (globalThis as any).MILESAWAY_USE_LOCAL_API;
  const envUseLocal =
    typeof process !== 'undefined'
      ? process?.env?.EXPO_PUBLIC_MILESAWAY_USE_LOCAL_API ||
        process?.env?.MILESAWAY_USE_LOCAL_API
      : undefined;

  return String(envUseLocal || globalUseLocal || '').toLowerCase() === 'true';
};

export const API_BASE_URL =
  getConfiguredUrl() || (__DEV__ && shouldUseLocalApi() ? getLocalUrl() : PRODUCTION_API_URL);

if (!API_BASE_URL) {
  throw new Error('MILESAWAY_API_URL must be configured for release builds');
}

if (!__DEV__ && !API_BASE_URL.startsWith('https://')) {
  throw new Error('MILESAWAY_API_URL must use HTTPS outside local debug builds');
}
