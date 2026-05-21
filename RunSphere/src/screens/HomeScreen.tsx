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
  const cityWeekly = leaderboardEntries['city:weekly'] || [];
  const localRank = leaderboardRanks['local:today'];
  const weeklyDistance = Number(weeklyStats?.totalDistance || 0);
  const totalDistance = Number(
    stats?.totalDistance || profile?.totalDistance || 0,
  );

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

  const activeProgress = Math.max(8, Math.min(100, (weeklyDistance / 6) * 100));

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
        <Text style={styles.kicker}>TODAY'S DISTANCE</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroValue}>
            {Number(dailyStats?.totalDistance || 0).toFixed(1)}
          </Text>
          <Text style={styles.heroUnit}>KM</Text>
        </View>

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
            <Text style={styles.startActionText}>START RUN</Text>
            <Text style={styles.startActionArrow}>NOW</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bentoGrid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>LAST PERFORMANCE</Text>
            <Text style={styles.cardTitle}>
              {lastRun
                ? `${Number(lastRun.distance || 0).toFixed(2)} KM`
                : 'NO RUN YET'}
            </Text>
            <Text style={styles.cardMeta}>
              {lastRun
                ? formatRelativeRunDate(lastRun.date)
                : 'Start a tracked run to build the dashboard.'}
            </Text>
            {lastRun ? (
              <View style={styles.metricRow}>
                <View>
                  <Text style={styles.metricValue}>
                    {formatPace(
                      lastRun.averagePace ||
                        (lastRun.avgSpeed ? 60 / lastRun.avgSpeed : 0),
                    )}
                  </Text>
                  <Text style={styles.metricCaption}>PACE</Text>
                </View>
                <View>
                  <Text style={styles.metricValue}>
                    {formatClock(lastRun.duration || 0)}
                  </Text>
                  <Text style={styles.metricCaption}>TIME</Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={[styles.card, styles.cardLow]}>
            <Text style={styles.cardLabel}>ACTIVE TIME / WEEK</Text>
            <Text style={styles.highlightValue}>
              {weeklyDistance.toFixed(1)}{' '}
              <Text style={styles.highlightUnit}>KM</Text>
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${activeProgress}%` }]}
              />
            </View>
            <Text style={styles.cardMeta}>
              {(weeklyStats?.totalRuns || 0).toString()} runs synced this week
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>LOCAL SQUAD RANK</Text>
            <Text style={styles.rankValue}>
              {localRank ? `#${localRank}` : '--'}
            </Text>
            <Text style={styles.cardMeta}>{locationLabel}</Text>
            <Text style={styles.cardHint}>
              Lifetime distance {totalDistance.toFixed(1)} km
            </Text>
          </View>
        </View>

        <View style={styles.previewGrid}>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>LOCAL TODAY</Text>
            {localToday.length > 0 ? (
              localToday.map((entry, index) => (
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
                Local standings appear after your first synced GPS run.
              </Text>
            )}
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>CITY WEEK</Text>
            {cityWeekly.length > 0 ? (
              cityWeekly.map((entry, index) => (
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
                City momentum will populate when leaderboard data is available.
              </Text>
            )}
          </View>
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
  kicker: {
    color: Colors.primary + '99',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 6,
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
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  startActionArrow: {
    color: Colors.onPrimaryFixed,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.4,
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
