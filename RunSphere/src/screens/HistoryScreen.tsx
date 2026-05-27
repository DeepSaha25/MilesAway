import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import MiniRoutePreview from '../components/MiniRoutePreview';
import {useUserStore} from '../store/userStore';
import {Colors} from '../theme/colors';
import {
  formatClock,
  formatDistance,
  formatPace,
  formatRunDate,
} from '../utils/runMetrics';

const HistoryScreen = () => {
  const recentRuns = useUserStore(state => state.recentRuns);
  const refreshDashboard = useUserStore(state => state.refreshDashboard);
  const isLoading = useUserStore(state => state.isLoading);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    await refreshDashboard(25);
  }, [refreshDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadHistory();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceDim} />
      <AppHeader />

      {isLoading && recentRuns.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primaryContainer}
            />
          }>
          <Text style={styles.title}>RUN HISTORY</Text>
          <Text style={styles.subtitle}>
            Every saved route, pace split, and distance from your real runs.
          </Text>

          {recentRuns.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No runs saved yet</Text>
              <Text style={styles.emptyText}>
                Start your first outdoor run to unlock history.
              </Text>
            </View>
          ) : (
            recentRuns.map((run, index) => {
              const pace =
                run.averagePace || (run.avgSpeed ? 60 / run.avgSpeed : 0);

              return (
                <View key={`${run._id || run.date}-${index}`} style={styles.runCard}>
                  <MiniRoutePreview
                    coordinates={run.coordinates || []}
                    style={styles.mapPreview}
                  />
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.distanceValue}>
                        {formatDistance(Number(run.distance || 0))} km
                      </Text>
                      <Text style={styles.runDate}>
                        {formatRunDate(run.date)}
                      </Text>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {run.location?.city || 'Outdoor'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricRow}>
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricLabel}>Duration</Text>
                      <Text style={styles.metricValue}>
                        {formatClock(run.duration || 0)}
                      </Text>
                    </View>
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricLabel}>Average Pace</Text>
                      <Text style={styles.metricValue}>{formatPace(pace)}</Text>
                    </View>
                    <View style={styles.metricBlock}>
                      <Text style={styles.metricLabel}>Calories</Text>
                      <Text style={styles.metricValue}>
                        {Math.round(run.caloriesBurned || 0)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={styles.footerSpace} />
        </ScrollView>
      )}
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
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontFamily: 'Lexend-Bold',
    fontSize: 40,
    fontWeight: '900',
    color: Colors.onSurface,
    letterSpacing: -2,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 22,
  },
  emptyState: {
    marginTop: 80,
    padding: 24,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.onSurface,
    fontSize: 20,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 8,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  runCard: {
    marginBottom: 18,
    padding: 16,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '22',
  },
  mapPreview: {
    height: 118,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  distanceValue: {
    color: Colors.onSurface,
    fontSize: 26,
    fontWeight: '900',
  },
  runDate: {
    marginTop: 4,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  badgeText: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricBlock: {
    flex: 1,
  },
  metricLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    color: Colors.onSurface,
    fontSize: 14,
    fontWeight: '700',
  },
  footerSpace: {
    height: 120,
  },
});

export default HistoryScreen;
