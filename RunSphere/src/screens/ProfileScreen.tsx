import React, {useCallback, useState} from 'react';
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
import {useFocusEffect} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AppHeader from '../components/AppHeader';
import {useUserStore} from '../store/userStore';
import {Colors} from '../theme/colors';
import {getCurrentLocation, requestLocationPermission} from '../utils/location';
import {formatPace, formatRunDate} from '../utils/runMetrics';

const ProfileScreen = () => {
  const profile = useUserStore(state => state.profile);
  const stats = useUserStore(state => state.stats);
  const weeklyStats = useUserStore(state => state.weeklyStats);
  const recentRuns = useUserStore(state => state.recentRuns);
  const isLoading = useUserStore(state => state.isLoading);
  const refreshDashboard = useUserStore(state => state.refreshDashboard);
  const updateBackendLocation = useUserStore(state => state.updateBackendLocation);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingLocation, setSyncingLocation] = useState(false);

  const loadProfile = useCallback(async () => {
    await refreshDashboard(8);
  }, [refreshDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProfile();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncLocation = async () => {
    setSyncingLocation(true);

    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        Toast.show({
          type: 'error',
          text1: 'Location permission required',
          text2: 'Enable location access to join local leaderboards.',
        });
        return;
      }

      const position = await getCurrentLocation();
      await updateBackendLocation(
        position.coords.latitude,
        position.coords.longitude,
      );

      Toast.show({
        type: 'success',
        text1: 'Location synced',
        text2: 'Leaderboards will now use your latest position.',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not sync location',
        text2: error?.message || 'Please check GPS and try again.',
      });
    } finally {
      setSyncingLocation(false);
    }
  };

  const totalDistance = Number(stats?.totalDistance || profile?.totalDistance || 0);
  const totalRuns = Number(stats?.totalRuns || 0);
  const weeklyDistance = Number(weeklyStats?.totalDistance || 0);
  const runnerInitial = (profile?.name || 'Runner').slice(0, 1).toUpperCase();

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
      <AppHeader />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryContainer}
          />
        }>
        <View style={styles.profileHero}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{runnerInitial}</Text>
          </View>
          <View style={styles.profileIntro}>
            <Text style={styles.profileLabel}>Runner profile</Text>
            <Text style={styles.profileName}>{profile?.name || 'Runner'}</Text>
            <Text style={styles.profileMeta}>
              {profile?.location?.city
                ? `${profile.location.city}, ${profile.location.state || ''}`
                : 'Location not synced'}
            </Text>
            <Text style={styles.profileMeta}>
              Joined{' '}
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString()
                : 'recently'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleSyncLocation}
          disabled={syncingLocation}>
          <Text style={styles.locationButtonText}>
            {syncingLocation ? 'SYNCING GPS' : 'SYNC LOCATION'}
          </Text>
        </TouchableOpacity>

        <View style={styles.profileStatsGrid}>
          <View style={styles.profileStatCardWide}>
            <Text style={styles.profileStatLabel}>Lifetime distance</Text>
            <Text style={styles.profileStatValue}>
              {totalDistance.toFixed(0)} <Text style={styles.profileStatUnit}>km</Text>
            </Text>
            <Text style={styles.profileStatMeta}>
              {weeklyDistance.toFixed(1)} km this week
            </Text>
          </View>

          <View style={styles.profileStatCard}>
            <Text style={styles.profileStatLabel}>Runs</Text>
            <Text style={styles.profileStatValue}>{totalRuns}</Text>
          </View>
          <View style={styles.profileStatCard}>
            <Text style={styles.profileStatLabel}>Streak</Text>
            <Text style={styles.profileStatValue}>{profile?.streak || 0}</Text>
            <Text style={styles.profileStatMeta}>days</Text>
          </View>
          <View style={styles.profileStatCard}>
            <Text style={styles.profileStatLabel}>Avg pace</Text>
            <Text style={styles.profileStatValueSmall}>
              {stats?.averagePace ? formatPace(stats.averagePace) : '--'}
            </Text>
          </View>
        </View>

        <View style={styles.runsSection}>
          <Text style={styles.profileSectionTitle}>Recent runs</Text>
          {recentRuns.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                Your latest runs will appear here after the first saved route.
              </Text>
            </View>
          ) : (
            recentRuns.slice(0, 4).map((run, index) => (
              <View key={`${run._id || run.date}-${index}`} style={styles.runRow}>
                <View>
                  <Text style={styles.runDistance}>
                    {Number(run.distance || 0).toFixed(2)} km
                  </Text>
                  <Text style={styles.runDate}>{formatRunDate(run.date)}</Text>
                </View>
                <View style={styles.runMeta}>
                  <Text style={styles.runPace}>
                    {formatPace(run.averagePace || (run.avgSpeed ? 60 / run.avgSpeed : 0))}
                  </Text>
                  <Text style={styles.runLocation}>
                    {run.location?.city || 'Outdoor'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.surface},
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  content: {paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24},
  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
    padding: 18,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '22',
  },
  profileAvatar: {
    width: 74,
    height: 74,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  profileAvatarText: {
    color: Colors.onPrimaryFixed,
    fontFamily: 'Lexend-Bold',
    fontSize: 28,
    fontWeight: '900',
  },
  profileIntro: {
    flex: 1,
  },
  profileLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  profileName: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  profileMeta: {
    marginTop: 5,
    color: Colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
  },
  profileStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  profileStatCardWide: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '22',
  },
  profileStatCard: {
    width: '47.8%',
    minHeight: 124,
    borderRadius: 20,
    padding: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'space-between',
  },
  profileStatLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  profileStatValue: {
    marginTop: 10,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 34,
    fontWeight: '900',
  },
  profileStatValueSmall: {
    marginTop: 10,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 22,
    fontWeight: '900',
  },
  profileStatUnit: {
    color: Colors.primary,
    fontSize: 16,
  },
  profileStatMeta: {
    marginTop: 8,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
  },
  profileSectionTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 14,
  },
  heroSection: {
    gap: 20,
    marginBottom: 18,
  },
  avatarShell: {
    width: 192,
    height: 192,
    borderRadius: 999,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    padding: 5,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 44,
    fontWeight: '900',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  statusBolt: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: Colors.secondary,
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  heroCopy: {
    alignItems: 'center',
  },
  tierChip: {
    backgroundColor: Colors.tertiaryContainer + '26',
    color: Colors.tertiary,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  nameText: {
    marginTop: 14,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 50,
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  heroMeta: {
    marginTop: 6,
    color: Colors.onSurfaceVariant,
    fontSize: 13,
  },
  locationButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    marginBottom: 18,
  },
  locationButtonText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  statsGrid: {
    gap: 16,
    marginBottom: 20,
  },
  heroStat: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 32,
    padding: 28,
  },
  statKicker: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  heroStatValue: {
    marginTop: 10,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 56,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -3,
  },
  heroStatUnit: {
    color: Colors.primary,
    fontSize: 20,
  },
  statTrend: {
    marginTop: 8,
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  miniCard: {
    width: '47.8%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 22,
    padding: 18,
  },
  miniLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  miniValue: {
    marginTop: 10,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  miniHint: {
    marginTop: 8,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 32,
    padding: 28,
    marginBottom: 18,
  },
  chartKicker: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  chartTitle: {
    marginTop: 6,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 180,
    gap: 8,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  barLabel: {
    marginTop: 12,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '800',
  },
  barLabelActive: {
    color: Colors.primary,
  },
  achievementsCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    width: '47.8%',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  achievementOrb: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: Colors.primary + '22',
    marginBottom: 12,
  },
  achievementTitle: {
    color: Colors.onSurface,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  achievementDesc: {
    marginTop: 6,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  runsSection: {
    marginBottom: 18,
  },
  emptySection: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
  },
  emptySectionText: {
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  runRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainerHigh,
    marginBottom: 10,
  },
  runDistance: {
    color: Colors.onSurface,
    fontSize: 18,
    fontWeight: '800',
  },
  runDate: {
    marginTop: 4,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  runMeta: {
    alignItems: 'flex-end',
  },
  runPace: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  runLocation: {
    marginTop: 4,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  footerSpace: {
    height: 120,
  },
});

export default ProfileScreen;
