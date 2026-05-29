import {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useGoalStore} from '../store/goalStore';
import {useLeaderboardStore} from '../store/leaderboardStore';
import {useUserStore} from '../store/userStore';
import {formatDistance, formatPace} from '../utils/runMetrics';

export const useDashboard = () => {
  const profile = useUserStore(state => state.profile);
  const dailyStats = useUserStore(state => state.dailyStats);
  const weeklyStats = useUserStore(state => state.weeklyStats);
  const recentRuns = useUserStore(state => state.recentRuns);
  const refreshDashboard = useUserStore(state => state.refreshDashboard);
  const dashboardStatus = useUserStore(state => state.status);
  const dashboardError = useUserStore(state => state.error);
  const leaderboardRanks = useLeaderboardStore(state => state.ranks);
  const loadLeaderboard = useLeaderboardStore(state => state.loadLeaderboard);
  const weeklyHoursGoal = useGoalStore(state => state.weeklyHoursGoal);
  const increaseWeeklyGoal = useGoalStore(state => state.increaseWeeklyGoal);
  const decreaseWeeklyGoal = useGoalStore(state => state.decreaseWeeklyGoal);
  const [refreshing, setRefreshing] = useState(false);

  const loadHome = useCallback(async () => {
    await Promise.allSettled([
      refreshDashboard(6),
      loadLeaderboard('global', 'weekly', 5),
      loadLeaderboard('city', 'weekly', 5),
    ]);
  }, [loadLeaderboard, refreshDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [loadHome]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadHome();
    } finally {
      setRefreshing(false);
    }
  }, [loadHome]);

  const lastRun = recentRuns[0];
  const dailyDistance = Number(dailyStats?.totalDistance || 0);
  const activeHours = Number(weeklyStats?.totalDuration || 0) / 3600;
  const activeProgress = Math.min(100, (activeHours / weeklyHoursGoal) * 100);
  const rank = leaderboardRanks['global:weekly'] ?? null;
  const lastPace = lastRun
    ? formatPace(
        lastRun.averagePace || (lastRun.avgSpeed ? 60 / lastRun.avgSpeed : 0),
      )
    : '--';

  return {
    profile,
    refreshing,
    dashboardStatus,
    dashboardError,
    isInitialLoading: dashboardStatus === 'LOADING' && !profile,
    onRefresh,
    onRetryDashboard: () => refreshDashboard(6),
    displayDistance: formatDistance(dailyDistance, true),
    lastRun,
    lastRunLabel: lastRun
      ? `${formatDistance(Number(lastRun.distance || 0))} km`
      : 'No runs yet',
    lastPace,
    activeHours,
    activeProgress,
    rank,
    weeklyHoursGoal,
    increaseWeeklyGoal,
    decreaseWeeklyGoal,
  };
};
