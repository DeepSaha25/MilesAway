import {create} from 'zustand';
import RunService from '../services/runService';
import UserService from '../services/userService';
import GuestRunStorage from '../services/guestRunStorage';
import {guestUser, isGuestUser} from '../services/guestSession';
import {useAuthStore} from './authStore';

export type DashboardStatus = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';

export interface PeriodStats {
  totalDistance: number;
  totalDuration: number;
  totalRuns: number;
  avgSpeed: number;
  averagePace: number;
  caloriesBurned: number;
  elevationGain: number;
}

interface UserState {
  profile: any | null;
  stats: PeriodStats;
  dailyStats: PeriodStats;
  weeklyStats: PeriodStats;
  recentRuns: any[];
  status: DashboardStatus;
  error: string | null;
  lastUpdatedAt: number | null;
  refreshDashboard: (historyLimit?: number) => Promise<void>;
  updateBackendLocation: (latitude: number, longitude: number) => Promise<any>;
  reset: () => void;
}

export const emptyPeriodStats: PeriodStats = {
  totalDistance: 0,
  totalDuration: 0,
  totalRuns: 0,
  avgSpeed: 0,
  averagePace: 0,
  caloriesBurned: 0,
  elevationGain: 0,
};

const toNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const roundDistance = (value: number): number => Math.round(value * 100) / 100;

const roundMetric = (value: number): number => Math.round(value * 100) / 100;

export const normalizePeriodStats = (raw: unknown): PeriodStats => {
  const source = (raw || {}) as Partial<PeriodStats>;

  return {
    totalDistance: roundDistance(toNumber(source.totalDistance)),
    totalDuration: toNumber(source.totalDuration),
    totalRuns: toNumber(source.totalRuns),
    avgSpeed: roundMetric(toNumber(source.avgSpeed)),
    averagePace: roundMetric(toNumber(source.averagePace)),
    caloriesBurned: roundMetric(toNumber(source.caloriesBurned)),
    elevationGain: roundMetric(toNumber(source.elevationGain)),
  };
};

export const summarizeRuns = (runs: any[]): PeriodStats => {
  const totalDistance = runs.reduce(
    (total, run) => total + toNumber(run.distance),
    0,
  );
  const totalDuration = runs.reduce(
    (total, run) => total + toNumber(run.duration),
    0,
  );
  const caloriesBurned = runs.reduce(
    (total, run) => total + toNumber(run.caloriesBurned),
    0,
  );
  const elevationGain = runs.reduce(
    (total, run) => total + toNumber(run.elevationGain),
    0,
  );
  const avgSpeed =
    totalDuration > 0 ? totalDistance / (totalDuration / 3600) : 0;
  const averagePace =
    totalDistance > 0 ? totalDuration / 60 / totalDistance : 0;

  return normalizePeriodStats({
    totalDistance,
    totalDuration,
    totalRuns: runs.length,
    avgSpeed,
    averagePace,
    caloriesBurned,
    elevationGain,
  });
};

const sameLocalDay = (dateA: Date, dateB: Date) =>
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getDate() === dateB.getDate();

const getRunDate = (run: any) => new Date(run.date || run.endTime || run.createdAt);

const getDashboardErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Could not refresh dashboard. Check your connection and try again.';
};

const guestProfile = {
  ...guestUser,
  totalDistance: 0,
  totalRuns: 0,
  streak: 0,
};

export const useUserStore = create<UserState>()((set, get) => ({
  profile: null,
  stats: emptyPeriodStats,
  dailyStats: emptyPeriodStats,
  weeklyStats: emptyPeriodStats,
  recentRuns: [],
  status: 'IDLE',
  error: null,
  lastUpdatedAt: null,
  refreshDashboard: async (historyLimit = 10) => {
    set({status: 'LOADING', error: null});

    try {
      if (isGuestUser(useAuthStore.getState().user)) {
        const currentProfile = get().profile;
        const dashboard = await GuestRunStorage.getDashboard(historyLimit);
        const stats = normalizePeriodStats(dashboard.stats);

        set({
          profile: {
            ...guestProfile,
            location: currentProfile?.location,
            totalDistance: stats.totalDistance,
            totalRuns: stats.totalRuns,
          },
          stats,
          dailyStats: normalizePeriodStats(dashboard.dailyStats),
          weeklyStats: normalizePeriodStats(dashboard.weeklyStats),
          recentRuns: dashboard.recentRuns || [],
          status: 'SUCCESS',
          error: null,
          lastUpdatedAt: Date.now(),
        });
        return;
      }

      const [profileRes, statsRes, dailyRes, weeklyRes, historyRes] =
        await Promise.all([
          UserService.getProfile(),
          RunService.getStats(),
          RunService.getDailyStats(),
          RunService.getWeeklyStats(),
          RunService.getHistory(historyLimit),
        ]);

      const nextProfile = profileRes.data;
      const recentRuns = historyRes.data || [];
      const now = new Date();
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      const historyStats = summarizeRuns(recentRuns);
      const historyDailyStats = summarizeRuns(
        recentRuns.filter((run: any) => sameLocalDay(getRunDate(run), now)),
      );
      const historyWeeklyStats = summarizeRuns(
        recentRuns.filter((run: any) => getRunDate(run) >= weekStart),
      );
      const serverStats = normalizePeriodStats(statsRes.data);
      const serverDailyStats = normalizePeriodStats(dailyRes.data);
      const serverWeeklyStats = normalizePeriodStats(weeklyRes.data);

      if (nextProfile) {
        await useAuthStore.getState().setUser(nextProfile);
      }

      set({
        profile: nextProfile,
        stats: serverStats.totalDistance > 0 ? serverStats : historyStats,
        dailyStats:
          serverDailyStats.totalDistance > 0
            ? serverDailyStats
            : historyDailyStats,
        weeklyStats:
          serverWeeklyStats.totalDistance > 0
            ? serverWeeklyStats
            : historyWeeklyStats,
        recentRuns,
        status: 'SUCCESS',
        error: null,
        lastUpdatedAt: Date.now(),
      });
    } catch (error) {
      set({
        status: 'ERROR',
        error: getDashboardErrorMessage(error),
      });
    }
  },
  updateBackendLocation: async (latitude, longitude) => {
    if (isGuestUser(useAuthStore.getState().user)) {
      const profile = {
        ...guestProfile,
        location: {latitude, longitude},
      };

      set({profile});
      await useAuthStore.getState().setUser(profile);
      return profile;
    }

    const response = await UserService.updateLocation(latitude, longitude);
    set({profile: response.data});
    await useAuthStore.getState().setUser(response.data);
    return response.data;
  },
  reset: () =>
    set({
      profile: null,
      stats: emptyPeriodStats,
      dailyStats: emptyPeriodStats,
      weeklyStats: emptyPeriodStats,
      recentRuns: [],
      status: 'IDLE',
      error: null,
      lastUpdatedAt: null,
    }),
}));
