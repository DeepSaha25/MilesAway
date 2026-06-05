import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import GradientButton from '../components/GradientButton';
import RouteMap from '../components/RouteMap';
import {useRunSummary} from '../hooks/useRunSummary';
import {Colors} from '../theme/colors';
import {
  formatDistance,
  formatClock,
  formatPace,
} from '../utils/runMetrics';

const RunSummaryScreen = ({navigation}: any) => {
  const runSummary = useRunSummary(navigation);
  const {
    saving,
    saveError,
    savedRun,
    summary,
    route,
    handleClose,
    saveRun,
    goHome,
    discardAndGoHome,
    viewProfile,
  } = runSummary;

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
            <Text style={styles.savedDistance}>
              {formatDistance(savedRun.distanceKm)}
            </Text>
            <Text style={styles.savedDistanceLabel}>km completed</Text>
          </View>

          <View style={styles.savedGrid}>
            <MetricCard label="Time" value={formatClock(savedRun.elapsedSeconds)} />
            <MetricCard label="Pace" value={formatPace(savedRun.averagePace)} />
            <MetricCard label="Global rank" value={savedRun.rank ? `#${savedRun.rank}` : '--'} />
            <MetricCard
              label="This week"
              value={`${formatDistance(savedRun.weeklyDistance, true)} km`}
            />
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

        <RouteMap coordinates={route} height={300} />

        <View style={styles.heroMetrics}>
          <View>
            <Text style={styles.distanceValue}>
              {formatDistance(summary.distanceKm)}
            </Text>
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
            <Text style={styles.cardValue}>{summary.coordinates.length}</Text>
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
            <Text style={styles.retryTitle}>Run not saved</Text>
            <Text style={styles.retryText}>
              {saveError} Your route is still on this device.
            </Text>
            <GradientButton title="Retry Save" onPress={saveRun} style={styles.saveButton} />
            <TouchableOpacity style={styles.secondaryButton} onPress={discardAndGoHome}>
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
