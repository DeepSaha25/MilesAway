import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {BackHandler} from 'react-native';
import Toast from 'react-native-toast-message';
import GuestRunStorage from '../services/guestRunStorage';
import {isGuestUser} from '../services/guestSession';
import RunService from '../services/runService';
import {useAuthStore} from '../store/authStore';
import {useLeaderboardStore} from '../store/leaderboardStore';
import {
  selectCanSaveRun,
  selectRunCoordinates,
  selectRunMetrics,
  selectRunTiming,
  useRunStore,
} from '../store/runStore';
import {useUserStore} from '../store/userStore';

export type SavedRunResult = {
  distanceKm: number;
  elapsedSeconds: number;
  averagePace: number;
  rank: number | null;
  streak: number;
  weeklyDistance: number;
  caloriesBurned: number;
  elevationGain: number;
  routePoints: number;
};

export const useRunSummary = (navigation: any) => {
  const [saving, setSaving] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedRun, setSavedRun] = useState<SavedRunResult | null>(null);
  const saveStartedRef = useRef(false);
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);
  const allowLeavingRef = useRef(false);
  const authUser = useAuthStore(state => state.user);
  const profile = useUserStore(state => state.profile);
  const refreshDashboard = useUserStore(state => state.refreshDashboard);
  const loadLeaderboard = useLeaderboardStore(state => state.loadLeaderboard);
  const resetRun = useRunStore(state => state.resetRun);
  const runState = useRunStore();

  const summary = useMemo(() => {
    const metrics = selectRunMetrics(runState, profile?.weightKg);
    const timing = selectRunTiming(runState);

    return {
      ...metrics,
      startedAt: timing.startedAt,
      finishedAt: timing.finishedAt || new Date().toISOString(),
    };
  }, [profile?.weightKg, runState]);

  const route = useMemo(() => selectRunCoordinates(runState), [runState]);

  const goHome = useCallback(() => {
    allowLeavingRef.current = true;
    navigation.reset({
      index: 0,
      routes: [{name: 'Main', params: {screen: 'Home'}}],
    });
  }, [navigation]);

  const viewProfile = useCallback(() => {
    allowLeavingRef.current = true;
    navigation.reset({
      index: 0,
      routes: [{name: 'Main', params: {screen: 'Profile'}}],
    });
  }, [navigation]);

  const saveRun = useCallback(async (): Promise<boolean> => {
    if (saveInFlightRef.current) {
      return saveInFlightRef.current;
    }

    const saveTask = (async () => {
      if (!selectCanSaveRun(runState)) {
        setSaving(false);
        setSaveError(
          'Track at least 0.01 km, 30 seconds, and two GPS points before saving a run.',
        );
        Toast.show({
          type: 'error',
          text1: 'Run is too short',
          text2: 'A saved run needs at least 0.01 km and 30 seconds.',
        });
        return false;
      }

      setSaving(true);
      setSaveError(null);
      try {
        if (isGuestUser(authUser)) {
          await GuestRunStorage.saveRun({
            clientRunId: runState.clientRunId || `guest-${Date.now()}`,
            coordinates: summary.coordinates,
            distanceKm: summary.distanceKm,
            elapsedSeconds: summary.elapsedSeconds,
            elevationGain: summary.elevationGain,
            weightKg: profile?.weightKg,
            startedAt: summary.startedAt,
            finishedAt: summary.finishedAt,
          });
        } else {
          await RunService.submitRun({
            clientRunId: runState.clientRunId || `manual-${Date.now()}`,
            startedAt: summary.startedAt,
            finishedAt: summary.finishedAt,
            elapsedSeconds: summary.elapsedSeconds,
            coordinates: summary.coordinates,
          });
        }

        await Promise.all([
          refreshDashboard(20),
          loadLeaderboard('global', 'weekly', 6),
          loadLeaderboard('city', 'weekly', 6),
        ]);

        const userState = useUserStore.getState();
        const leaderboardState = useLeaderboardStore.getState();

        setSavedRun({
          distanceKm: summary.distanceKm,
          elapsedSeconds: summary.elapsedSeconds,
          averagePace: summary.averagePace,
          rank: leaderboardState.ranks['global:weekly'] ?? null,
          streak: userState.profile?.streak || profile?.streak || 0,
          weeklyDistance: Number(userState.weeklyStats?.totalDistance || 0),
          caloriesBurned: summary.caloriesBurned,
          elevationGain: summary.elevationGain,
          routePoints: summary.coordinates.length,
        });

        resetRun();

        Toast.show({
          type: 'success',
          text1: 'Run saved',
          text2: isGuestUser(authUser)
            ? 'Guest mode keeps this run on this device.'
            : 'Your stats and leaderboards have been updated.',
        });
        return true;
      } catch (error: any) {
        setSaveError(error?.message || 'Please try again.');
        Toast.show({
          type: 'error',
          text1: 'Could not save run',
          text2: error?.message || 'Please try again.',
        });
        return false;
      } finally {
        setSaving(false);
      }
    })();

    saveInFlightRef.current = saveTask;
    saveTask.finally(() => {
      if (saveInFlightRef.current === saveTask) {
        saveInFlightRef.current = null;
      }
    });

    return saveTask;
  }, [
    authUser,
    loadLeaderboard,
    profile?.streak,
    profile?.weightKg,
    refreshDashboard,
    resetRun,
    runState,
    summary.averagePace,
    summary.caloriesBurned,
    summary.coordinates,
    summary.distanceKm,
    summary.elevationGain,
    summary.elapsedSeconds,
    summary.finishedAt,
    summary.startedAt,
  ]);

  const handleClose = useCallback(async () => {
    if (savedRun) {
      Toast.show({
        type: 'success',
        text1: 'Run saved',
        text2: 'Your run is available from your profile dashboard.',
      });
      goHome();
      return;
    }

    Toast.show({
      type: 'info',
      text1: saving ? 'Saving run' : 'Saving before closing',
      text2: 'We will close this screen after your run is saved.',
    });

    const didSave = await saveRun();
    if (didSave) {
      goHome();
    }
  }, [goHome, saveRun, savedRun, saving]);

  useEffect(() => {
    if (saveStartedRef.current || savedRun) {
      return;
    }

    saveStartedRef.current = true;
    saveRun();
  }, [saveRun, savedRun]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });

    return () => subscription.remove();
  }, [handleClose]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (allowLeavingRef.current) {
        return;
      }

      event.preventDefault();
      handleClose();
    });

    return unsubscribe;
  }, [handleClose, navigation]);

  return {
    saving,
    saveError,
    savedRun,
    summary,
    route,
    handleClose,
    saveRun,
    goHome,
    viewProfile,
  };
};
