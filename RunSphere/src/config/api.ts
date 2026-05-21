import {Platform} from 'react-native';

declare const __DEV__: boolean;
declare const process:
  | {
      env?: {
        MILESAWAY_API_URL?: string;
      };
    }
  | undefined;

const getConfiguredUrl = () => {
  const globalUrl = (globalThis as any).MILESAWAY_API_URL;
  const envUrl =
    typeof process !== 'undefined' ? process?.env?.MILESAWAY_API_URL : undefined;

  return (envUrl || globalUrl || '').trim();
};

const getLocalUrl = () =>
  Platform.OS === 'android'
    ? 'http://localhost:5000/api'
    : 'http://localhost:5000/api';

export const API_BASE_URL = getConfiguredUrl() || (__DEV__ ? getLocalUrl() : '');

if (!API_BASE_URL) {
  throw new Error('MILESAWAY_API_URL must be configured for release builds');
}

if (!__DEV__ && !API_BASE_URL.startsWith('https://')) {
  throw new Error('MILESAWAY_API_URL must use HTTPS outside local debug builds');
}
