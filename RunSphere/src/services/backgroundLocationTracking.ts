import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {
  RunTrackPoint,
  shouldRestoreTelemetrySession,
  useRunStore,
} from '../store/runStore';
import {recoverActiveTelemetrySession} from './telemetrySessionStorage';

export const BACKGROUND_LOCATION_TASK_NAME =
  'milesaway-background-location-tracking';

export type BackgroundLocationTrackingResult = {
  started: boolean;
  reason?: 'task-manager-unavailable' | 'permission-denied' | 'start-failed';
  message?: string;
};

type LocationTaskData = {
  locations?: Location.LocationObject[];
};

export const BACKGROUND_LOCATION_OPTIONS: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 1500,
  distanceInterval: 1.5,
  pausesUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: true,
  foregroundService: {
    notificationTitle: 'MilesAway is tracking your run',
    notificationBody: 'GPS tracking stays active while your run is in progress.',
    notificationColor: '#80F3F8',
    killServiceOnDestroy: false,
  },
};

const toRunTrackPoint = (
  location: Location.LocationObject,
): RunTrackPoint => ({
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
  timestamp: new Date(location.timestamp || Date.now()).getTime(),
});

const restoreJournalIfNeeded = async () => {
  const session = await recoverActiveTelemetrySession().catch(() => null);
  if (!session) {
    return;
  }

  const store = useRunStore.getState();
  if (shouldRestoreTelemetrySession(store, session)) {
    store.restoreRunFromJournal(session);
  }
};

const ingestBackgroundLocations = async (
  locations: Location.LocationObject[] = [],
) => {
  if (locations.length === 0) {
    return;
  }

  await restoreJournalIfNeeded();

  for (const location of locations) {
    const store = useRunStore.getState();
    if (store.status !== 'TRACKING') {
      return;
    }

    store.addCoordinate(toRunTrackPoint(location));
  }
};

if (!TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK_NAME)) {
  TaskManager.defineTask<LocationTaskData>(
    BACKGROUND_LOCATION_TASK_NAME,
    async ({data, error}) => {
      if (error) {
        return;
      }

      await ingestBackgroundLocations(data?.locations);
    },
  );
}

export const requestBackgroundLocationPermission =
  async (): Promise<BackgroundLocationTrackingResult> => {
    const available = await TaskManager.isAvailableAsync();
    if (!available) {
      return {
        started: false,
        reason: 'task-manager-unavailable',
        message: 'Background tracking is unavailable in this build.',
      };
    }

    const currentPermission = await Location.getBackgroundPermissionsAsync();
    if (currentPermission.status === 'granted') {
      return {started: true};
    }

    const requestedPermission =
      await Location.requestBackgroundPermissionsAsync();
    if (requestedPermission.status !== 'granted') {
      return {
        started: false,
        reason: 'permission-denied',
        message: 'Background location permission was not granted.',
      };
    }

    return {started: true};
  };

export const startBackgroundLocationTracking =
  async (): Promise<BackgroundLocationTrackingResult> => {
    const permissionResult = await requestBackgroundLocationPermission();
    if (!permissionResult.started) {
      return permissionResult;
    }

    try {
      const alreadyStarted =
        await Location.hasStartedLocationUpdatesAsync(
          BACKGROUND_LOCATION_TASK_NAME,
        );
      if (!alreadyStarted) {
        await Location.startLocationUpdatesAsync(
          BACKGROUND_LOCATION_TASK_NAME,
          BACKGROUND_LOCATION_OPTIONS,
        );
      }

      return {started: true};
    } catch (error: any) {
      return {
        started: false,
        reason: 'start-failed',
        message: error?.message || 'Unable to start background GPS tracking.',
      };
    }
  };

export const stopBackgroundLocationTracking = async () => {
  const alreadyStarted =
    await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME,
    );
  if (alreadyStarted) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
  }
};

export const isBackgroundLocationTrackingStarted = () =>
  Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
