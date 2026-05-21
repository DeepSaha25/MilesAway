import {Linking} from 'react-native';
import * as Location from 'expo-location';

type LocationPosition = {
  coords: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
  };
  timestamp: number;
};

type LocationWatch = {
  remove: () => void;
};

export const requestLocationPermission = async () => {
  const currentStatus = await Location.getForegroundPermissionsAsync();

  if (currentStatus.status === 'granted') {
    return true;
  }

  const requestStatus = await Location.requestForegroundPermissionsAsync();
  if (requestStatus.status !== 'granted') {
    if (!requestStatus.canAskAgain) {
      await Linking.openSettings().catch(() => undefined);
    }
    return false;
  }

  return true;
};

export const getCurrentLocation = async (): Promise<LocationPosition> => {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest,
  });

  return toPosition(location);
};

export const startLocationWatch = (
  onSuccess: (position: LocationPosition) => void,
  onError: (error: {message: string; code?: number}) => void,
): LocationWatch => {
  let locationSubscription: Location.LocationSubscription | null = null;
  let cancelled = false;

  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Highest,
      timeInterval: 2000,
      distanceInterval: 5,
    },
    position => onSuccess(toPosition(position)),
  )
    .then(subscription => {
      if (cancelled) {
        subscription.remove();
        return;
      }

      locationSubscription = subscription;
    })
    .catch(error => {
      onError({
        message: error?.message || 'Unable to start GPS tracking',
      });
    });

  return {
    remove: () => {
      cancelled = true;
      locationSubscription?.remove();
    },
  };
};

export const stopLocationWatch = (watch: LocationWatch | null) => {
  watch?.remove();
};

const toPosition = (location: Location.LocationObject): LocationPosition => ({
  coords: {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude:
      typeof location.coords.altitude === 'number'
        ? location.coords.altitude
        : null,
    accuracy:
      typeof location.coords.accuracy === 'number'
        ? location.coords.accuracy
        : null,
    speed:
      typeof location.coords.speed === 'number' ? location.coords.speed : null,
    heading:
      typeof location.coords.heading === 'number'
        ? location.coords.heading
        : null,
  },
  timestamp: new Date(location.timestamp || Date.now()).getTime(),
});
