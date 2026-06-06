import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {BackHandler} from 'react-native';
import Toast from 'react-native-toast-message';
import GuestRunStorage from '../services/guestRunStorage';
import {isGuestUser} from '../services/guestSession';
import RunService from '../services/runService';
import {recoverActiveTelemetrySession} from '../services/telemetrySessionStorage';
import {useAuthStore} from '../store/authStore';
import {useLeaderboardStore} from '../store/leaderboardStore';
import {
  selectCleanedVerifiedRoute,
  selectSaveBlockReason,
  selectRunMetrics,
  selectRunTiming,
  selectVerifiedCoordinates,
  selectVerifiedDistance,
  shouldRestoreTelemetrySession,
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
  const [journalChecked, setJournalChecked] = useState(false);
  const saveStartedRef = useRef(false);
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);
  const allowLeavingRef = useRef(false);
  const authUser = useAuthStore(state => state.user);
  const profile = useUserStore(state => state.profile);
  const refreshDashboard = useUserStore(state => state.refreshDashboard);
  const loadLeaderboard = useLeaderboardStore(state => state.loadLeaderboard);
  const resetRun = useRunStore(state => state.resetRun);
  const restoreRunFromJournal = useRunStore(state => state.restoreRunFromJournal);
  const runState = useRunStore();

  const buildSummary = useCallback(
    (state = useRunStore.getState()) => {
      const metrics = selectRunMetrics(state, profile?.weightKg);
      const timing = selectRunTiming(state);
      const verifiedCoordinates = selectVerifiedCoordinates(state);
      const cleanedRoute = selectCleanedVerifiedRoute(state);
      const verifiedDistanceKm = selectVerifiedDistance(state);

      return {
        ...metrics,
        coordinates: verifiedCoordinates,
        route: cleanedRoute,
        distanceKm: verifiedDistanceKm,
        startedAt: timing.startedAt,
        finishedAt: timing.finishedAt || new Date().toISOString(),
      };
    },
    [profile?.weightKg],
  );

  const summary = useMemo(
    () => buildSummary(runState),
    [buildSummary, runState],
  );

  const route = useMemo(() => selectCleanedVerifiedRoute(runState), [runState]);

  const goHome = useCallback(() => {
    allowLeavingRef.current = true;
    navigation.reset({
      index: 0,
      routes: [{name: 'Main', params: {screen: 'Home'}}],
    });
  }, [navigation]);

  const discardAndGoHome = useCallback(() => {
    allowLeavingRef.current = true;
    resetRun();
    navigation.reset({
      index: 0,
      routes: [{name: 'Main', params: {screen: 'Home'}}],
    });
  }, [navigation, resetRun]);

  const viewProfile = useCallback(() => {
    allowLeavingRef.current = true;
    navigation.reset({
      index: 0,
      routes: [{name: 'Main', params: {screen: 'Profile'}}],
    });
  }, [navigation]);

  useEffect(() => {
    let active = true;

    const recoverJournal = async () => {
      const session = await recoverActiveTelemetrySession().catch(() => null);
      if (!active) {
        return;
      }

      if (session) {
        const currentRun = useRunStore.getState();
        if (shouldRestoreTelemetrySession(currentRun, session)) {
          restoreRunFromJournal(session);
        }
      }

      if (active) {
        setJournalChecked(true);
      }
    };

    recoverJournal();

    return () => {
      active = false;
    };
  }, [restoreRunFromJournal]);

  const saveRun = useCallback(async (): Promise<boolean> => {
    if (saveInFlightRef.current) {
      return saveInFlightRef.current;
    }

    const saveTask = (async () => {
      const latestRunState = useRunStore.getState();
      const latestSummary = buildSummary(latestRunState);
      const saveBlockReason = selectSaveBlockReason(latestRunState);
      if (saveBlockReason) {
        setSaving(false);
        setSaveError(saveBlockReason);
        Toast.show({
          type: 'error',
          text1: 'Session is too short',
          text2: saveBlockReason,
        });
        return false;
      }

      setSaving(true);
      setSaveError(null);
      try {
        if (isGuestUser(authUser)) {
          await GuestRunStorage.saveRun({
            clientRunId: latestRunState.clientRunId || `guest-${Date.now()}`,
            coordinates: latestSummary.coordinates,
            route: latestSummary.route,
            distanceKm: latestSummary.distanceKm,
            elapsedSeconds: latestSummary.elapsedSeconds,
            elevationGain: latestSummary.elevationGain,
            weightKg: profile?.weightKg,
            startedAt: latestSummary.startedAt,
            finishedAt: latestSummary.finishedAt,
          });
        } else {
          await RunService.submitRun({
            clientRunId: latestRunState.clientRunId || `manual-${Date.now()}`,
            startedAt: latestSummary.startedAt,
            finishedAt: latestSummary.finishedAt,
            elapsedSeconds: latestSummary.elapsedSeconds,
            coordinates: latestSummary.coordinates,
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
          distanceKm: latestSummary.distanceKm,
          elapsedSeconds: latestSummary.elapsedSeconds,
          averagePace: latestSummary.averagePace,
          rank: leaderboardState.ranks['global:weekly'] ?? null,
          streak: userState.profile?.streak || profile?.streak || 0,
          weeklyDistance: Number(userState.weeklyStats?.totalDistance || 0),
          caloriesBurned: latestSummary.caloriesBurned,
          elevationGain: latestSummary.elevationGain,
          routePoints: latestSummary.route.length,
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
    buildSummary,
    loadLeaderboard,
    profile?.streak,
    profile?.weightKg,
    refreshDashboard,
    resetRun,
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

    if (saveError) {
      discardAndGoHome();
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
  }, [discardAndGoHome, goHome, saveError, saveRun, savedRun, saving]);

  useEffect(() => {
    if (!journalChecked || saveStartedRef.current || savedRun) {
      return;
    }

    saveStartedRef.current = true;
    saveRun();
  }, [journalChecked, saveRun, savedRun]);

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
    journalChecked,
    saveError,
    savedRun,
    summary,
    route,
    handleClose,
    saveRun,
    goHome,
    discardAndGoHome,
    viewProfile,
  };
};
