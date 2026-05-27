import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import GradientButton from '../components/GradientButton';
import RouteMap from '../components/RouteMap';
import GuestRunStorage from '../services/guestRunStorage';
import {isGuestUser} from '../services/guestSession';
import RunService from '../services/runService';
import {useAuthStore} from '../store/authStore';
import {useLeaderboardStore} from '../store/leaderboardStore';
import {useRunStore} from '../store/runStore';
import {useUserStore} from '../store/userStore';
import {Colors} from '../theme/colors';
import {
  calculatePaceMinutesPerKm,
  estimateCalories,
  formatClock,
  formatPace,
} from '../utils/runMetrics';

type SavedRunResult = {
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

const RunSummaryScreen = ({navigation}: any) => {
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
  const coordinates = useRunStore(state => state.coordinates);
  const clientRunId = useRunStore(state => state.clientRunId);
  const distanceKm = useRunStore(state => state.distanceKm);
  const elapsedSeconds = useRunStore(state => state.elapsedSeconds);
  const elevationGain = useRunStore(state => state.elevationGain);
  const startedAt = useRunStore(state => state.startedAt);
  const finishedAt = useRunStore(state => state.finishedAt);

  const summary = useMemo(() => {
    const averagePace = calculatePaceMinutesPerKm(distanceKm, elapsedSeconds);

    return {
      distanceKm,
      elapsedSeconds,
      elevationGain,
      averagePace,
      caloriesBurned: estimateCalories(distanceKm, profile?.weightKg),
      finishedAt: finishedAt || new Date().toISOString(),
    };
  }, [distanceKm, elapsedSeconds, elevationGain, finishedAt, profile?.weightKg]);

  const goHome = useCallback(() => {
    allowLeavingRef.current = true;
    navigation.reset({
      index: 0,
      routes: [{name: 'Main', params: {screen: 'Home'}}],
    });
  }, [navigation]);

  const viewProfile = () => {
    allowLeavingRef.current = true;
    navigation.reset({
      index: 0,
      routes: [{name: 'Main', params: {screen: 'Profile'}}],
    });
  };

  const saveRun = useCallback(async (): Promise<boolean> => {
    if (saveInFlightRef.current) {
      return saveInFlightRef.current;
    }

    const saveTask = (async () => {
      if (coordinates.length < 2 || distanceKm < 0.01 || elapsedSeconds < 30) {
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
            clientRunId: clientRunId || `guest-${Date.now()}`,
            coordinates,
            distanceKm: summary.distanceKm,
            elapsedSeconds: summary.elapsedSeconds,
            elevationGain: summary.elevationGain,
            weightKg: profile?.weightKg,
            startedAt,
            finishedAt: summary.finishedAt,
          });
        } else {
          await RunService.submitRun({
            clientRunId: clientRunId || `manual-${Date.now()}`,
            coordinates,
          });
        }

        await Promise.all([
          refreshDashboard(20),
          loadLeaderboard('global', 'today', 6),
          loadLeaderboard('city', 'weekly', 6),
        ]);

        const userState = useUserStore.getState();
        const leaderboardState = useLeaderboardStore.getState();

        setSavedRun({
          distanceKm: summary.distanceKm,
          elapsedSeconds: summary.elapsedSeconds,
          averagePace: summary.averagePace,
          rank: leaderboardState.ranks['global:today'] ?? null,
          streak: userState.profile?.streak || profile?.streak || 0,
          weeklyDistance: Number(userState.weeklyStats?.totalDistance || 0),
          caloriesBurned: summary.caloriesBurned,
          elevationGain: summary.elevationGain,
          routePoints: coordinates.length,
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
    clientRunId,
    coordinates,
    distanceKm,
    elapsedSeconds,
    loadLeaderboard,
    profile?.streak,
    profile?.weightKg,
    refreshDashboard,
    resetRun,
    startedAt,
    summary.averagePace,
    summary.caloriesBurned,
    summary.distanceKm,
    summary.elevationGain,
    summary.elapsedSeconds,
    summary.finishedAt,
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

  if (savedRun) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceDim} />
        <TouchableOpacity
          accessibilityLabel="Close saved run summary"
          activeOpacity={0.75}
          style={styles.closeButton}
          onPress={handleClose}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
        <ScrollView
          contentContainerStyle={styles.savedState}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.savedEyebrow}>Run saved</Text>
          <Text style={styles.savedTitle}>Nice work today</Text>
          <Text style={styles.savedSubtitle}>
            Your run is logged. You can review it from your profile dashboard.
          </Text>

          <View style={styles.savedHeroCard}>
            <Text style={styles.savedDistance}>{savedRun.distanceKm.toFixed(2)}</Text>
            <Text style={styles.savedDistanceLabel}>km completed</Text>
          </View>

          <View style={styles.savedGrid}>
            <MetricCard label="Time" value={formatClock(savedRun.elapsedSeconds)} />
            <MetricCard label="Pace" value={formatPace(savedRun.averagePace)} />
            <MetricCard label="Global rank" value={savedRun.rank ? `#${savedRun.rank}` : '--'} />
            <MetricCard label="This week" value={`${savedRun.weeklyDistance.toFixed(1)} km`} />
            <MetricCard label="Calories" value={String(Math.round(savedRun.caloriesBurned))} />
            <MetricCard label="Route points" value={String(savedRun.routePoints)} />
          </View>

          <View style={styles.streakCard}>
            <Text style={styles.streakTitle}>
              {savedRun.streak > 0
                ? `${savedRun.streak}-day streak active`
                : 'First streak starts here'}
            </Text>
            <Text style={styles.streakText}>
              Come back tomorrow to keep your momentum going.
            </Text>
          </View>

          <View style={styles.actions}>
            <GradientButton title="Back Home" onPress={goHome} style={styles.saveButton} />
            <TouchableOpacity style={styles.secondaryButton} onPress={viewProfile}>
              <Text style={styles.secondaryButtonText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceDim} />
      <TouchableOpacity
        accessibilityLabel="Close run summary"
        activeOpacity={0.75}
        style={styles.closeButton}
        onPress={handleClose}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={styles.summaryState}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              {saveError ? 'Save interrupted' : 'Saving run'}
            </Text>
            <Text style={styles.title}>
              {saveError ? 'Run Summary' : 'Saving your run'}
            </Text>
          </View>
        </View>

        <RouteMap coordinates={coordinates} height={300} />

        <View style={styles.heroMetrics}>
          <View>
            <Text style={styles.distanceValue}>{summary.distanceKm.toFixed(2)}</Text>
            <Text style={styles.distanceLabel}>KM COMPLETED</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatPace(summary.averagePace)}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Duration</Text>
            <Text style={styles.cardValue}>{formatClock(summary.elapsedSeconds)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Calories</Text>
            <Text style={styles.cardValue}>{Math.round(summary.caloriesBurned)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Elevation</Text>
            <Text style={styles.cardValue}>{Math.round(summary.elevationGain)} m</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Route Points</Text>
            <Text style={styles.cardValue}>{coordinates.length}</Text>
          </View>
        </View>

        {saving ? (
          <View style={styles.saveProgressCard}>
            <ActivityIndicator size="large" color={Colors.primaryContainer} />
            <Text style={styles.saveProgressTitle}>Saving run</Text>
            <Text style={styles.saveProgressText}>
              Keep this screen open while your route is logged.
            </Text>
          </View>
        ) : saveError ? (
          <View style={styles.retryCard}>
            <Text style={styles.retryTitle}>Run not saved yet</Text>
            <Text style={styles.retryText}>
              {saveError} Your route is still on this device.
            </Text>
            <GradientButton title="Retry Save" onPress={saveRun} style={styles.saveButton} />
            <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
              <Text style={styles.secondaryButtonText}>Back Home</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
};

const MetricCard = ({label, value}: {label: string; value: string}) => (
  <View style={styles.savedMetricCard}>
    <Text style={styles.savedMetricLabel}>{label}</Text>
    <Text style={styles.savedMetricValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 52,
  },
  closeButton: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Lexend-Bold',
    fontSize: 30,
    fontWeight: '900',
  },
  summaryState: {
    paddingBottom: 28,
    paddingRight: 2,
  },
  savedState: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 28,
  },
  savedEyebrow: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  savedTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '900',
  },
  savedSubtitle: {
    marginTop: 10,
    color: Colors.onSurfaceVariant,
    fontSize: 15,
    lineHeight: 23,
  },
  savedHeroCard: {
    marginTop: 28,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '22',
  },
  savedDistance: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 76,
    lineHeight: 82,
    fontWeight: '900',
  },
  savedDistanceLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '800',
  },
  savedGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  savedMetricCard: {
    width: '47.8%',
    borderRadius: 18,
    padding: 16,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  savedMetricLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  savedMetricValue: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 20,
    fontWeight: '900',
  },
  streakCard: {
    marginTop: 16,
    borderRadius: 20,
    padding: 18,
    backgroundColor: Colors.primary + '12',
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  streakTitle: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  streakText: {
    marginTop: 6,
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
  },
  header: {
    marginBottom: 18,
  },
  eyebrow: {
    color: Colors.secondary,
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    color: Colors.onSurface,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  heroMetrics: {
    marginTop: 20,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  distanceValue: {
    color: Colors.onSurface,
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -3,
  },
  distanceLabel: {
    marginTop: -2,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  badgeText: {
    color: Colors.primaryContainer,
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    width: '47.8%',
    padding: 18,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '22',
  },
  cardLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  cardValue: {
    marginTop: 10,
    color: Colors.onSurface,
    fontSize: 22,
    fontWeight: '800',
  },
  saveProgressCard: {
    marginTop: 24,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  saveProgressTitle: {
    marginTop: 14,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 20,
    fontWeight: '900',
  },
  saveProgressText: {
    marginTop: 8,
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryCard: {
    marginTop: 24,
    borderRadius: 22,
    padding: 20,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  retryTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 22,
    fontWeight: '900',
  },
  retryText: {
    marginTop: 8,
    marginBottom: 18,
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    marginTop: 30,
    marginBottom: 24,
  },
  saveButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  secondaryButtonText: {
    color: Colors.onSurface,
    fontSize: 15,
    fontWeight: '700',
  },
  footerSpace: {
    height: 30,
  },
});

export default RunSummaryScreen;
