import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {
  BACKGROUND_LOCATION_OPTIONS,
  BACKGROUND_LOCATION_TASK_NAME,
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
} from '../src/services/backgroundLocationTracking';
import {persistTelemetrySession} from '../src/services/telemetrySessionStorage';
import {initialRunFacts, RunFacts, useRunStore} from '../src/store/runStore';

const makeLocation = (
  longitude: number,
  timestamp: number,
): Location.LocationObject => ({
  coords: {
    latitude: 0,
    longitude,
    altitude: null,
    accuracy: 5,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp,
});

const makeState = (overrides: Partial<RunFacts>): RunFacts => ({
  ...initialRunFacts,
  ...overrides,
});

const runBackgroundTask = (locations: Location.LocationObject[]) =>
  (TaskManager as any).__taskManagerMocks.runTask(
    BACKGROUND_LOCATION_TASK_NAME,
    {
      data: {locations},
      error: null,
      executionInfo: {
        eventId: 'test-event',
        taskName: BACKGROUND_LOCATION_TASK_NAME,
      },
    },
  );

describe('backgroundLocationTracking', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    useRunStore.setState(initialRunFacts);
  });

  it('defines and starts the Expo background location task with sports tracking options', async () => {
    expect(TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK_NAME)).toBe(true);

    await expect(startBackgroundLocationTracking()).resolves.toEqual({
      started: true,
    });

    expect(Location.getBackgroundPermissionsAsync).toHaveBeenCalled();
    expect(Location.startLocationUpdatesAsync).toHaveBeenCalledWith(
      BACKGROUND_LOCATION_TASK_NAME,
      BACKGROUND_LOCATION_OPTIONS,
    );
  });

  it('does not request duplicate native registration when background tracking is already started', async () => {
    (Location.hasStartedLocationUpdatesAsync as jest.Mock).mockResolvedValueOnce(
      true,
    );

    await expect(startBackgroundLocationTracking()).resolves.toEqual({
      started: true,
    });

    expect(Location.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it('ingests background GPS packets into the active tracking session', async () => {
    useRunStore.setState(
      makeState({
        status: 'TRACKING',
        clientRunId: 'background-active-run',
        startTime: 1_000,
        coordinates: [{latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5}],
      }),
    );

    await runBackgroundTask([makeLocation(0.001, 3_000)]);

    expect(useRunStore.getState().coordinates).toHaveLength(2);
    expect(useRunStore.getState().coordinates[1]).toMatchObject({
      longitude: 0.001,
      timestamp: 3_000,
      accuracy: 5,
    });
  });

  it('recovers a journaled active session before ingesting headless background packets', async () => {
    await persistTelemetrySession(
      makeState({
        status: 'TRACKING',
        clientRunId: 'background-journal-run',
        startTime: 1_000,
        coordinates: [{latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5}],
      }),
    );
    useRunStore.setState(initialRunFacts);

    await runBackgroundTask([makeLocation(0.001, 3_000)]);

    expect(useRunStore.getState()).toMatchObject({
      status: 'TRACKING',
      clientRunId: 'background-journal-run',
    });
    expect(useRunStore.getState().coordinates).toHaveLength(2);
  });

  it('stops native background tracking when a run is paused, finished, or discarded', async () => {
    (Location.hasStartedLocationUpdatesAsync as jest.Mock).mockResolvedValueOnce(
      true,
    );

    await stopBackgroundLocationTracking();

    expect(Location.stopLocationUpdatesAsync).toHaveBeenCalledWith(
      BACKGROUND_LOCATION_TASK_NAME,
    );
  });
});
