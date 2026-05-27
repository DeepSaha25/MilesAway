import { create } from 'zustand';
import RunService from '../services/runService';
import UserService from '../services/userService';
import GuestRunStorage from '../services/guestRunStorage';
import { guestUser, isGuestUser } from '../services/guestSession';
import { useAuthStore } from './authStore';

interface UserState {
  profile: any | null;
  stats: any;
  dailyStats: any;
  weeklyStats: any;
  recentRuns: any[];
  isLoading: boolean;
  refreshDashboard: (historyLimit?: number) => Promise<void>;
  updateBackendLocation: (latitude: number, longitude: number) => Promise<any>;
  reset: () => void;
}

const emptyStats = {
  totalDistance: 0,
  totalDuration: 0,
  totalRuns: 0,
  avgSpeed: 0,
  averagePace: 0,
  caloriesBurned: 0,
  elevationGain: 0,
};

const emptyPeriodStats = {
  totalDistance: 0,
  totalRuns: 0,
  avgSpeed: 0,
  averagePace: 0,
};

const sumRuns = (runs: any[]) => {
  const totalDistance = runs.reduce(
    (total, run) => total + Number(run.distance || 0),
    0,
  );
  const totalDuration = runs.reduce(
    (total, run) => total + Number(run.duration || 0),
    0,
  );

  return {
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalDuration,
    totalRuns: runs.length,
    avgSpeed: totalDuration > 0 ? totalDistance / (totalDuration / 3600) : 0,
    averagePace: totalDistance > 0 ? totalDuration / 60 / totalDistance : 0,
  };
};

const sameLocalDay = (dateA: Date, dateB: Date) =>
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getDate() === dateB.getDate();

const getRunDate = (run: any) => new Date(run.date || run.endTime || run.createdAt);

const guestProfile = {
  ...guestUser,
  totalDistance: 0,
  totalRuns: 0,
  streak: 0,
};

export const useUserStore = create<UserState>()((set, get) => ({
  profile: null,
  stats: emptyStats,
  dailyStats: emptyPeriodStats,
  weeklyStats: emptyPeriodStats,
  recentRuns: [],
  isLoading: false,
  refreshDashboard: async (historyLimit = 10) => {
    set({ isLoading: true });

    try {
      if (isGuestUser(useAuthStore.getState().user)) {
        const currentProfile = get().profile;
        const dashboard = await GuestRunStorage.getDashboard(historyLimit);
        set({
          profile: {
            ...guestProfile,
            location: currentProfile?.location,
            totalDistance: dashboard.stats.totalDistance,
            totalRuns: dashboard.stats.totalRuns,
          },
          stats: dashboard.stats,
          dailyStats: dashboard.dailyStats,
          weeklyStats: dashboard.weeklyStats,
          recentRuns: dashboard.recentRuns,
        });
        return;
      }

      const [profileRes, statsRes, dailyRes, weeklyRes, historyRes] =
        await Promise.allSettled([
          UserService.getProfile(),
          RunService.getStats(),
          RunService.getDailyStats(),
          RunService.getWeeklyStats(),
          RunService.getHistory(historyLimit),
        ]);

      const nextProfile =
        profileRes.status === 'fulfilled'
          ? profileRes.value.data
          : get().profile;
      const recentRuns =
        historyRes.status === 'fulfilled'
          ? historyRes.value.data || []
          : get().recentRuns;
      const now = new Date();
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      const historyStats = sumRuns(recentRuns);
      const historyDailyStats = sumRuns(
        recentRuns.filter((run: any) => sameLocalDay(getRunDate(run), now)),
      );
      const historyWeeklyStats = sumRuns(
        recentRuns.filter((run: any) => getRunDate(run) >= weekStart),
      );
      const serverStats =
        statsRes.status === 'fulfilled' ? statsRes.value.data : get().stats;
      const serverDailyStats =
        dailyRes.status === 'fulfilled' ? dailyRes.value.data : get().dailyStats;
      const serverWeeklyStats =
        weeklyRes.status === 'fulfilled'
          ? weeklyRes.value.data
          : get().weeklyStats;

      if (nextProfile) {
        await useAuthStore.getState().setUser(nextProfile);
      }

      set({
        profile: nextProfile,
        stats:
          Number(serverStats?.totalDistance || 0) > 0
            ? serverStats
            : historyStats,
        dailyStats:
          Number(serverDailyStats?.totalDistance || 0) > 0
            ? serverDailyStats
            : historyDailyStats,
        weeklyStats:
          Number(serverWeeklyStats?.totalDistance || 0) > 0
            ? serverWeeklyStats
            : historyWeeklyStats,
        recentRuns,
      });
    } finally {
      set({ isLoading: false });
    }
  },
  updateBackendLocation: async (latitude, longitude) => {
    if (isGuestUser(useAuthStore.getState().user)) {
      const profile = {
        ...guestProfile,
        location: { latitude, longitude },
      };

      set({ profile });
      await useAuthStore.getState().setUser(profile);
      return profile;
    }

    const response = await UserService.updateLocation(latitude, longitude);
    set({ profile: response.data });
    await useAuthStore.getState().setUser(response.data);
    return response.data;
  },
  reset: () =>
    set({
      profile: null,
      stats: emptyStats,
      dailyStats: emptyPeriodStats,
      weeklyStats: emptyPeriodStats,
      recentRuns: [],
      isLoading: false,
    }),
}));
