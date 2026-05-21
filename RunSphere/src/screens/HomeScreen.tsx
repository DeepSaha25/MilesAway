import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {LinearGradient} from 'expo-linear-gradient';
import AppHeader from '../components/AppHeader';
import { useLeaderboardStore } from '../store/leaderboardStore';
import { useUserStore } from '../store/userStore';
import { Colors } from '../theme/colors';
import {
  formatClock,
  formatPace,
  formatRelativeRunDate,
} from '../utils/runMetrics';

const HomeScreen = ({ navigation }: any) => {
  const profile = useUserStore(state => state.profile);
  const stats = useUserStore(state => state.stats);
  const dailyStats = useUserStore(state => state.dailyStats);
  const weeklyStats = useUserStore(state => state.weeklyStats);
  const recentRuns = useUserStore(state => state.recentRuns);
  const refreshDashboard = useUserStore(state => state.refreshDashboard);
  const isLoading = useUserStore(state => state.isLoading);
  const leaderboardEntries = useLeaderboardStore(state => state.entries);
  const leaderboardRanks = useLeaderboardStore(state => state.ranks);
  const loadLeaderboard = useLeaderboardStore(state => state.loadLeaderboard);
  const [refreshing, setRefreshing] = useState(false);

  const loadHome = useCallback(async () => {
    await Promise.allSettled([
      refreshDashboard(6),
      loadLeaderboard('local', 'today', 5),
      loadLeaderboard('city', 'weekly', 5),
    ]);
  }, [loadLeaderboard, refreshDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [loadHome]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadHome();
    } finally {
      setRefreshing(false);
    }
  };

  const lastRun = recentRuns[0];
  const localToday = leaderboardEntries['local:today'] || [];
  const localRank = leaderboardRanks['local:today'];
  const dailyGoalKm = 2;
  const dailyDistance = Number(dailyStats?.totalDistance || 0);
  const weeklyDistance = Number(weeklyStats?.totalDistance || 0);
  const totalDistance = Number(
    stats?.totalDistance || profile?.totalDistance || 0,
  );
  const firstName = profile?.name ? String(profile.name).split(' ')[0] : 'Runner';

  const location = profile?.location;
  const locationLabel =
    location?.city && location?.state
      ? `${location.city}, ${location.state}`
      : location?.city || location?.state
      ? location.city || location.state
      : typeof location?.latitude === 'number' &&
        typeof location?.longitude === 'number'
      ? 'Location synced'
      : 'Location not synced';

  const dailyProgress = Math.min(100, (dailyDistance / dailyGoalKm) * 100);
  const remainingGoal = Math.max(0, dailyGoalKm - dailyDistance);

  if (isLoading && !profile) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={Colors.primaryContainer} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surface} />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <AppHeader showStreak streakCount={profile?.streak || 0} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryContainer}
          />
        }
      >
        <View style={styles.commandPanel}>
          <Text style={styles.kicker}>Hi {firstName}</Text>
          <Text style={styles.heroTitle}>Ready for today's run?</Text>
          <Text style={styles.locationText}>{locationLabel}</Text>

          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigation.navigate('RunTracking')}
            style={styles.startActionWrap}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startAction}
            >
              <View>
                <Text style={styles.startActionText}>Start Run</Text>
                <Text style={styles.startActionMeta}>GPS tracking</Text>
              </View>
              <Text style={styles.startActionArrow}>GO</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>Daily goal</Text>
              <Text style={styles.sectionTitle}>
                {dailyDistance.toFixed(1)} / {dailyGoalKm.toFixed(1)} km
              </Text>
            </View>
            <Text style={styles.goalPercent}>{Math.round(dailyProgress)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${dailyProgress}%` }]} />
          </View>
          <Text style={styles.goalCopy}>
            {remainingGoal > 0
              ? `Run ${remainingGoal.toFixed(1)} km more to finish today's goal.`
              : 'Goal complete. Nice work keeping the rhythm alive.'}
          </Text>
          <Text style={styles.streakCopy}>
            {(profile?.streak || 0) > 0
              ? `${profile?.streak || 0}-day streak active. Run today to keep it going.`
              : 'Start today to build your first streak.'}
          </Text>
        </View>

        <View style={styles.compactGrid}>
          <View style={styles.compactCard}>
            <Text style={styles.compactLabel}>Local rank</Text>
            <Text style={styles.compactValue}>
              {localRank ? `#${localRank}` : '--'}
            </Text>
            <Text style={styles.compactMeta}>
              {localRank ? 'Keep climbing nearby' : 'Save a run to unlock rankings'}
            </Text>
          </View>
          <View style={styles.compactCard}>
            <Text style={styles.compactLabel}>This week</Text>
            <Text style={styles.compactValue}>{weeklyDistance.toFixed(1)} km</Text>
            <Text style={styles.compactMeta}>
              {(weeklyStats?.totalRuns || 0).toString()} runs logged
            </Text>
          </View>
        </View>

        <View style={styles.lastRunCard}>
          <View>
            <Text style={styles.sectionLabel}>Last run</Text>
            <Text style={styles.lastRunTitle}>
              {lastRun
                ? `${Number(lastRun.distance || 0).toFixed(2)} km`
                : 'No runs yet'}
            </Text>
            <Text style={styles.cardMeta}>
              {lastRun
                ? `${formatRelativeRunDate(lastRun.date)} - ${formatClock(
                    lastRun.duration || 0,
                  )} - ${formatPace(
                    lastRun.averagePace ||
                      (lastRun.avgSpeed ? 60 / lastRun.avgSpeed : 0),
                  )}`
                : 'Start your first run to unlock rankings and progress.'}
            </Text>
          </View>
          <Text style={styles.totalDistanceText}>
            {totalDistance.toFixed(1)} km lifetime
          </Text>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>Leaderboard</Text>
              <Text style={styles.previewTitle}>Local today</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Leaderboards')}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          {localToday.length > 0 ? (
            localToday.slice(0, 4).map((entry, index) => (
              <View
                key={`${entry.userId}-${index}`}
                style={styles.previewRow}
              >
                <Text style={styles.previewRank}>{entry.rank}</Text>
                <Text numberOfLines={1} style={styles.previewName}>
                  {entry.name}
                </Text>
                <Text style={styles.previewValue}>
                  {Number(entry.totalDistance || 0).toFixed(1)} km
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              Start your first run to unlock rankings.
            </Text>
          )}
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  glowTop: {
    position: 'absolute',
    top: -160,
    right: -120,
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: Colors.primary + '14',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -110,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: Colors.tertiaryContainer + '12',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 24,
  },
  commandPanel: {
    marginBottom: 18,
  },
  kicker: {
    color: Colors.primary + '99',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    marginBottom: 8,
  },
  locationText: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  heroValue: {
    fontFamily: 'Lexend-Bold',
    fontSize: 92,
    lineHeight: 92,
    fontWeight: '900',
    color: Colors.onSurface,
    letterSpacing: -5,
  },
  heroUnit: {
    color: Colors.onSurfaceVariant,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
    marginLeft: 8,
    marginBottom: 10,
  },
  startActionWrap: {
    marginBottom: 24,
  },
  startAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 8,
  },
  startActionText: {
    color: Colors.onPrimaryFixed,
    fontFamily: 'Lexend-Bold',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0,
  },
  startActionMeta: {
    color: Colors.onPrimaryFixed + 'CC',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  startActionArrow: {
    color: Colors.onPrimaryFixed,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  goalCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '22',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 24,
    fontWeight: '900',
  },
  goalPercent: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  goalCopy: {
    color: Colors.onSurface,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  streakCopy: {
    color: Colors.secondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    fontWeight: '700',
  },
  compactGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  compactCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 16,
    minHeight: 132,
    justifyContent: 'space-between',
  },
  compactLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  compactValue: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 12,
  },
  compactMeta: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  lastRunCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '22',
  },
  lastRunTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 28,
    fontWeight: '900',
  },
  totalDistanceText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 14,
  },
  viewAllText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  bentoGrid: {
    gap: 16,
    marginBottom: 22,
  },
  card: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 32,
    padding: 28,
    minHeight: 220,
    justifyContent: 'space-between',
  },
  cardLow: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  cardLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  cardTitle: {
    color: Colors.onSurface,
    fontSize: 30,
    fontFamily: 'Lexend-Bold',
    fontWeight: '800',
    fontStyle: 'italic',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  metricValue: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  metricCaption: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  highlightValue: {
    color: Colors.secondary,
    fontFamily: 'Lexend-Bold',
    fontSize: 46,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  highlightUnit: {
    color: Colors.onSurfaceVariant,
    fontSize: 16,
  },
  progressTrack: {
    marginTop: 16,
    height: 12,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.secondary,
  },
  rankValue: {
    color: Colors.tertiary,
    fontFamily: 'Lexend-Bold',
    fontSize: 52,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  cardMeta: {
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  cardHint: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  previewGrid: {
    gap: 16,
  },
  previewCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 24,
    padding: 20,
  },
  previewTitle: {
    color: Colors.onSurface,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  previewRank: {
    width: 28,
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  previewName: {
    flex: 1,
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },
  previewValue: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  emptyText: {
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
  },
  footerSpace: {
    height: 150,
  },
});

export default HomeScreen;
