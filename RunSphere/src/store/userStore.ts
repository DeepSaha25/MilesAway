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

      if (nextProfile) {
        await useAuthStore.getState().setUser(nextProfile);
      }

      set({
        profile: nextProfile,
        stats:
          statsRes.status === 'fulfilled' ? statsRes.value.data : get().stats,
        dailyStats:
          dailyRes.status === 'fulfilled'
            ? dailyRes.value.data
            : get().dailyStats,
        weeklyStats:
          weeklyRes.status === 'fulfilled'
            ? weeklyRes.value.data
            : get().weeklyStats,
        recentRuns:
          historyRes.status === 'fulfilled'
            ? historyRes.value.data || []
            : get().recentRuns,
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
