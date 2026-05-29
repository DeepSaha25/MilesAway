import {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useUserStore} from '../store/userStore';
import {Colors} from '../theme/colors';
import {getCurrentLocation, requestLocationPermission} from '../utils/location';
import {formatDistance, formatPace} from '../utils/runMetrics';

export const useProfileLocation = () => {
  const profile = useUserStore(state => state.profile);
  const stats = useUserStore(state => state.stats);
  const weeklyStats = useUserStore(state => state.weeklyStats);
  const recentRuns = useUserStore(state => state.recentRuns);
  const dashboardStatus = useUserStore(state => state.status);
  const refreshDashboard = useUserStore(state => state.refreshDashboard);
  const updateBackendLocation = useUserStore(state => state.updateBackendLocation);
  const [refreshing, setRefreshing] = useState(false);
  const [locating, setLocating] = useState(false);

  const loadProfile = useCallback(async () => {
    await refreshDashboard(8);
  }, [refreshDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProfile();
    } finally {
      setRefreshing(false);
    }
  }, [loadProfile]);

  const refreshLocation = useCallback(async () => {
    setLocating(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        return;
      }

      const position = await getCurrentLocation();
      if (
        typeof position.coords.accuracy === 'number' &&
        position.coords.accuracy > 100
      ) {
        return;
      }

      await updateBackendLocation(
        position.coords.latitude,
        position.coords.longitude,
      );
      await refreshDashboard(8);
    } finally {
      setLocating(false);
    }
  }, [refreshDashboard, updateBackendLocation]);

  const displayName = (profile?.name || 'Runner').toUpperCase();
  const location = profile?.location?.city
    ? `${profile.location.city}${
        profile.location.state ? `, ${profile.location.state}` : ''
      }`
    : 'LOCATION NOT SYNCED';
  const joined = profile?.createdAt
    ? new Date(profile.createdAt)
        .toLocaleDateString(undefined, {
          month: 'short',
          year: 'numeric',
        })
        .toUpperCase()
    : 'RECENTLY';
  const totalDistance = Number(stats?.totalDistance || profile?.totalDistance || 0);
  const totalRuns = Number(stats?.totalRuns || 0);
  const weeklyDistance = Number(weeklyStats?.totalDistance || 0);
  const streak = Number(profile?.streak || 0);
  const averagePace = stats?.averagePace ? formatPace(stats.averagePace) : '--';

  const statTiles = useMemo(
    () => [
      {
        label: 'FASTEST 5K',
        value: '--',
        caption: 'SYNCED FROM RUNS',
        color: Colors.tertiary,
      },
      {
        label: 'STREAK',
        value: `${streak}\nDAYS`,
        caption: 'PERSONAL BEST',
        color: Colors.secondary,
      },
      {
        label: 'AVG PACE',
        value: averagePace,
        caption: 'STEADY CLIMB',
        color: Colors.outlineVariant,
      },
      {
        label: 'RUNS',
        value: String(totalRuns),
        caption: 'TOTAL SESSIONS',
        color: Colors.outlineVariant,
      },
    ],
    [averagePace, streak, totalRuns],
  );

  return {
    profile,
    recentRuns,
    refreshing,
    locating,
    isInitialLoading: dashboardStatus === 'LOADING' && !profile,
    displayName,
    location,
    joined,
    totalDistance,
    weeklyDistance,
    statTiles,
    onRefresh,
    refreshLocation,
    formatDistance,
  };
};
