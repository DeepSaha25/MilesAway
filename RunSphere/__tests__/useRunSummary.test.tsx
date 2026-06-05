import React from 'react';
import {BackHandler} from 'react-native';
import Toast from 'react-native-toast-message';
import ReactTestRenderer from 'react-test-renderer';
import {useRunSummary} from '../src/hooks/useRunSummary';
import GuestRunStorage from '../src/services/guestRunStorage';
import {guestUser} from '../src/services/guestSession';
import RunService from '../src/services/runService';
import {useAuthStore} from '../src/store/authStore';
import {useLeaderboardStore} from '../src/store/leaderboardStore';
import {
  MINIMUM_SAVE_BLOCK_REASON,
  RunFacts,
  initialRunFacts,
  useRunStore,
} from '../src/store/runStore';
import {useUserStore} from '../src/store/userStore';

const productionSaveCoordinates = () => [
  {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5},
  {latitude: 0, longitude: 0.0002, timestamp: 13_000, accuracy: 5},
  {latitude: 0, longitude: 0.0004, timestamp: 25_000, accuracy: 5},
  {latitude: 0, longitude: 0.0006, timestamp: 37_000, accuracy: 5},
  {latitude: 0, longitude: 0.0008, timestamp: 49_000, accuracy: 5},
  {latitude: 0, longitude: 0.001, timestamp: 61_000, accuracy: 5},
];

const makeCompletedRun = (overrides: Partial<RunFacts>): RunFacts => ({
  ...initialRunFacts,
  status: 'COMPLETED',
  startTime: 1_000,
  endTime: 61_000,
  clientRunId: 'test-run-id',
  ...overrides,
});

const navigation = {
  addListener: jest.fn(() => jest.fn()),
  reset: jest.fn(),
};

let latestHook: ReturnType<typeof useRunSummary> | null = null;
let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

const HookHarness = () => {
  latestHook = useRunSummary(navigation);
  return null;
};

const flushHook = async () => {
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<HookHarness />);
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('useRunSummary save integrity', () => {
  const refreshDashboard = jest.fn(async () => undefined);
  const loadLeaderboard = jest.fn(async () => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    latestHook = null;
    jest
      .spyOn(BackHandler, 'addEventListener')
      .mockReturnValue({remove: jest.fn()} as any);
    jest.spyOn(GuestRunStorage, 'saveRun').mockResolvedValue({} as any);
    jest.spyOn(RunService, 'submitRun').mockResolvedValue({} as any);

    useRunStore.getState().resetRun();
    useAuthStore.setState({user: guestUser, token: null, hydrated: true});
    useUserStore.setState({
      profile: {...guestUser, weightKg: 70, streak: 0},
      weeklyStats: {totalDistance: 0},
      refreshDashboard,
    } as any);
    useLeaderboardStore.setState({
      ranks: {},
      loadLeaderboard,
    } as any);
  });

  afterEach(() => {
    if (renderer) {
      ReactTestRenderer.act(() => {
        renderer?.unmount();
      });
      renderer = null;
    }
    jest.restoreAllMocks();
  });

  it('blocks sessions that do not pass the five production save gates', async () => {
    useRunStore.setState(
      makeCompletedRun({
        coordinates: [
          {latitude: 0, longitude: 0, timestamp: 1_000, accuracy: 5, speed: 30},
          {latitude: 0, longitude: 0.001, timestamp: 4_000, accuracy: 5, speed: 30},
          {latitude: 0, longitude: 0.002, timestamp: 7_000, accuracy: 5, speed: 30},
        ],
      }),
    );

    await flushHook();

    expect(latestHook?.saveError).toBe(MINIMUM_SAVE_BLOCK_REASON);
    expect(GuestRunStorage.saveRun).not.toHaveBeenCalled();
    expect(RunService.submitRun).not.toHaveBeenCalled();
    expect(refreshDashboard).not.toHaveBeenCalled();
    expect(loadLeaderboard).not.toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: 'Session is too short',
        text2: MINIMUM_SAVE_BLOCK_REASON,
      }),
    );
  });

  it('backs home after a failed save without retrying the save task', async () => {
    const saveError = new Error('Railway is unreachable');
    jest.spyOn(GuestRunStorage, 'saveRun').mockRejectedValue(saveError);
    useRunStore.setState(
      makeCompletedRun({
        coordinates: productionSaveCoordinates(),
      }),
    );

    await flushHook();

    expect(GuestRunStorage.saveRun).toHaveBeenCalledTimes(1);
    expect(latestHook?.saveError).toBe('Railway is unreachable');

    await ReactTestRenderer.act(async () => {
      latestHook?.discardAndGoHome();
      await Promise.resolve();
    });

    expect(GuestRunStorage.saveRun).toHaveBeenCalledTimes(1);
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: 'Main', params: {screen: 'Home'}}],
    });
    expect(useRunStore.getState().status).toBe('IDLE');
  });

  it('keeps Retry Save as the only failed-state action that retries persistence', async () => {
    jest
      .spyOn(GuestRunStorage, 'saveRun')
      .mockRejectedValueOnce(new Error('Temporary outage'))
      .mockResolvedValueOnce({} as any);
    useRunStore.setState(
      makeCompletedRun({
        coordinates: productionSaveCoordinates(),
      }),
    );

    await flushHook();

    expect(GuestRunStorage.saveRun).toHaveBeenCalledTimes(1);
    expect(latestHook?.saveError).toBe('Temporary outage');

    await ReactTestRenderer.act(async () => {
      await latestHook?.saveRun();
      await Promise.resolve();
    });

    expect(GuestRunStorage.saveRun).toHaveBeenCalledTimes(2);
    expect(latestHook?.savedRun).not.toBeNull();
  });

  it('submits only verified coordinates to the backend on successful save', async () => {
    useAuthStore.setState({
      user: {_id: 'runner-1', isGuest: false, weightKg: 70, streak: 0},
      token: 'token',
      hydrated: true,
    });
    useUserStore.setState({
      profile: {_id: 'runner-1', weightKg: 70, streak: 0},
      weeklyStats: {totalDistance: 0.1},
      refreshDashboard,
    } as any);
    useRunStore.setState(
      makeCompletedRun({
        coordinates: [
          ...productionSaveCoordinates(),
          {
            latitude: 0,
            longitude: 0.0012,
            timestamp: 70_000,
            accuracy: 80,
          },
        ],
      }),
    );

    await flushHook();

    expect(RunService.submitRun).toHaveBeenCalledTimes(1);
    expect(RunService.submitRun).toHaveBeenCalledWith(
      expect.objectContaining({
        coordinates: expect.arrayContaining([
          expect.objectContaining({accuracy: 5}),
        ]),
      }),
    );
    const payload = (RunService.submitRun as jest.Mock).mock.calls[0][0];
    expect(payload.coordinates).toHaveLength(6);
    expect(payload.coordinates.every((coordinate: any) => coordinate.accuracy === 5)).toBe(
      true,
    );
    expect(refreshDashboard).toHaveBeenCalledWith(20);
    expect(loadLeaderboard).toHaveBeenCalledWith('global', 'weekly', 6);
    expect(loadLeaderboard).toHaveBeenCalledWith('city', 'weekly', 6);
  });
});
