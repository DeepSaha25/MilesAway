import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  StatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import GradientButton from '../components/GradientButton';
import RouteMap from '../components/RouteMap';
import RunService from '../services/runService';
import GuestRunStorage from '../services/guestRunStorage';
import {isGuestUser} from '../services/guestSession';
import {useLeaderboardStore} from '../store/leaderboardStore';
import {useRunStore} from '../store/runStore';
import {useAuthStore} from '../store/authStore';
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
};

const RunSummaryScreen = ({navigation}: any) => {
  const [saving, setSaving] = useState(false);
  const [savedRun, setSavedRun] = useState<SavedRunResult | null>(null);
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

  const discardRun = () => {
    resetRun();
    navigation.reset({
      index: 0,
      routes: [{name: 'Main'}],
    });
  };

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'Main', params: {screen: 'Home'}}],
    });
  };

  const viewLeaderboard = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'Main', params: {screen: 'Leaderboards'}}],
    });
  };

  useEffect(() => {
    if (!savedRun) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.reset({
          index: 0,
          routes: [{name: 'Main', params: {screen: 'Home'}}],
        });
        return true;
      },
    );

    return () => subscription.remove();
  }, [navigation, savedRun]);

  const saveRun = async () => {
    if (coordinates.length === 0 || distanceKm < 0.2) {
      Toast.show({
        type: 'error',
        text1: 'Run is too short',
        text2: 'Track at least 0.2 km before saving a run.',
      });
      return;
    }

    setSaving(true);
    try {
      if (!isGuestUser(authUser)) {
        await RunService.submitRun({
          clientRunId: clientRunId || `manual-${Date.now()}`,
          coordinates,
        });
      } else {
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
      }

      await Promise.all([
        refreshDashboard(20),
        loadLeaderboard('local', 'today', 6),
        loadLeaderboard('city', 'weekly', 6),
      ]);

      const userState = useUserStore.getState();
      const leaderboardState = useLeaderboardStore.getState();

      setSavedRun({
        distanceKm: summary.distanceKm,
        elapsedSeconds: summary.elapsedSeconds,
        averagePace: summary.averagePace,
        rank: leaderboardState.ranks['local:today'] ?? null,
        streak: userState.profile?.streak || profile?.streak || 0,
        weeklyDistance: Number(userState.weeklyStats?.totalDistance || 0),
      });

      resetRun();

      Toast.show({
        type: 'success',
        text1: 'Run saved',
        text2: isGuestUser(authUser)
          ? 'Guest mode keeps this run on this device.'
          : 'Your stats and leaderboards have been updated.',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not save run',
        text2: error?.message || 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (savedRun) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceDim} />

        <ScrollView
          contentContainerStyle={styles.savedState}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.savedEyebrow}>Run saved</Text>
          <Text style={styles.savedTitle}>Nice work today</Text>
          <Text style={styles.savedSubtitle}>
            Your run is logged. Check your rank or head back home for the next
            goal.
          </Text>

          <View style={styles.savedHeroCard}>
            <Text style={styles.savedDistance}>
              {savedRun.distanceKm.toFixed(2)}
            </Text>
            <Text style={styles.savedDistanceLabel}>km completed</Text>
          </View>

          <View style={styles.savedGrid}>
            <View style={styles.savedMetricCard}>
              <Text style={styles.savedMetricLabel}>Time</Text>
              <Text style={styles.savedMetricValue}>
                {formatClock(savedRun.elapsedSeconds)}
              </Text>
            </View>
            <View style={styles.savedMetricCard}>
              <Text style={styles.savedMetricLabel}>Pace</Text>
              <Text style={styles.savedMetricValue}>
                {formatPace(savedRun.averagePace)}
              </Text>
            </View>
            <View style={styles.savedMetricCard}>
              <Text style={styles.savedMetricLabel}>Local rank</Text>
              <Text style={styles.savedMetricValue}>
                {savedRun.rank ? `#${savedRun.rank}` : '--'}
              </Text>
            </View>
            <View style={styles.savedMetricCard}>
              <Text style={styles.savedMetricLabel}>This week</Text>
              <Text style={styles.savedMetricValue}>
                {savedRun.weeklyDistance.toFixed(1)} km
              </Text>
            </View>
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
            <GradientButton
              title="View Leaderboard"
              onPress={viewLeaderboard}
              style={styles.saveButton}
            />
            <TouchableOpacity style={styles.secondaryButton} onPress={goHome}>
              <Text style={styles.secondaryButtonText}>Back Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceDim} />

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Run Summary</Text>
          <Text style={styles.title}>Run Summary</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Discard this run?', 'The tracked route will be removed.', [
              {text: 'Keep', style: 'cancel'},
              {text: 'Discard', style: 'destructive', onPress: discardRun},
            ])
          }>
          <Text style={styles.closeText}>X</Text>
        </TouchableOpacity>
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
        <ActivityIndicator
          size="large"
          color={Colors.primaryContainer}
          style={styles.savingIndicator}
        />
      ) : (
        <View style={styles.actions}>
          <GradientButton title="Save Run" onPress={saveRun} style={styles.saveButton} />
          <TouchableOpacity style={styles.secondaryButton} onPress={discardRun}>
            <Text style={styles.secondaryButtonText}>Discard</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 52,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  closeText: {
    color: Colors.onSurfaceVariant,
    fontSize: 18,
    fontWeight: '700',
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
  actions: {
    marginTop: 30,
    marginBottom: 24,
  },
  saveButton: {
    marginBottom: 12,
  },
  savingIndicator: {
    marginTop: 28,
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
});

export default RunSummaryScreen;
