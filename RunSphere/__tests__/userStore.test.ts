import RunService from '../src/services/runService';
import UserService from '../src/services/userService';
import {
  emptyPeriodStats,
  normalizePeriodStats,
  useUserStore,
} from '../src/store/userStore';
import {useAuthStore} from '../src/store/authStore';

jest.mock('../src/services/runService', () => ({
  __esModule: true,
  default: {
    getStats: jest.fn(),
    getDailyStats: jest.fn(),
    getWeeklyStats: jest.fn(),
    getHistory: jest.fn(),
  },
}));

jest.mock('../src/services/userService', () => ({
  __esModule: true,
  default: {
    getProfile: jest.fn(),
    getMe: jest.fn(),
    updateLocation: jest.fn(),
  },
}));

const mockedRunService = RunService as jest.Mocked<typeof RunService>;
const mockedUserService = UserService as jest.Mocked<typeof UserService>;

describe('userStore dashboard contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.getState().reset();
    useAuthStore.setState({token: null, user: {_id: 'user-1'}});
  });

  it('normalizes missing and invalid period stats to safe numeric defaults', () => {
    expect(
      normalizePeriodStats({
        totalDistance: '12.345',
        totalDuration: 'bad-value',
        totalRuns: 3,
        avgSpeed: undefined,
        averagePace: Number.NaN,
      }),
    ).toEqual({
      ...emptyPeriodStats,
      totalDistance: 12.35,
      totalRuns: 3,
    });
  });

  it('sets success network state and normalized stats after dashboard refresh', async () => {
    mockedUserService.getProfile.mockResolvedValue({
      data: {_id: 'user-1', name: 'Runner'},
    });
    mockedRunService.getStats.mockResolvedValue({
      data: {
        totalDistance: 5.555,
        totalDuration: 1800,
        totalRuns: 2,
        avgSpeed: 11.111,
        averagePace: 5.555,
        caloriesBurned: 330,
        elevationGain: 12,
      },
    });
    mockedRunService.getDailyStats.mockResolvedValue({
      data: {...emptyPeriodStats, totalDistance: 1},
    });
    mockedRunService.getWeeklyStats.mockResolvedValue({
      data: {...emptyPeriodStats, totalDistance: 5},
    });
    mockedRunService.getHistory.mockResolvedValue({data: []});

    await useUserStore.getState().refreshDashboard(6);

    const state = useUserStore.getState();
    expect(state.status).toBe('SUCCESS');
    expect(state.error).toBeNull();
    expect(state.lastUpdatedAt).toEqual(expect.any(Number));
    expect(state.stats).toEqual({
      totalDistance: 5.56,
      totalDuration: 1800,
      totalRuns: 2,
      avgSpeed: 11.11,
      averagePace: 5.56,
      caloriesBurned: 330,
      elevationGain: 12,
    });
  });

  it('preserves stale dashboard data and exposes error state on refresh failure', async () => {
    const staleStats = {
      ...emptyPeriodStats,
      totalDistance: 9,
      totalDuration: 3600,
      totalRuns: 4,
    };
    const staleProfile = {_id: 'user-1', name: 'Cached Runner'};
    const staleRuns = [{_id: 'run-1', distance: 9}];

    useUserStore.setState({
      profile: staleProfile,
      stats: staleStats,
      dailyStats: staleStats,
      weeklyStats: staleStats,
      recentRuns: staleRuns,
      status: 'SUCCESS',
      error: null,
      lastUpdatedAt: 123,
    });
    mockedUserService.getProfile.mockRejectedValue(new Error('Network offline'));

    await useUserStore.getState().refreshDashboard(6);

    const state = useUserStore.getState();
    expect(state.status).toBe('ERROR');
    expect(state.error).toBe('Network offline');
    expect(state.lastUpdatedAt).toBe(123);
    expect(state.profile).toBe(staleProfile);
    expect(state.stats).toBe(staleStats);
    expect(state.dailyStats).toBe(staleStats);
    expect(state.weeklyStats).toBe(staleStats);
    expect(state.recentRuns).toBe(staleRuns);
  });

  it('reset restores idle network state and empty stats', () => {
    useUserStore.setState({
      status: 'ERROR',
      error: 'Previous error',
      lastUpdatedAt: 123,
      stats: {...emptyPeriodStats, totalDistance: 3},
    });

    useUserStore.getState().reset();

    const state = useUserStore.getState();
    expect(state.status).toBe('IDLE');
    expect(state.error).toBeNull();
    expect(state.lastUpdatedAt).toBeNull();
    expect(state.stats).toEqual(emptyPeriodStats);
  });
});
