import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {useFocusEffect} from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import {useUserStore} from '../store/userStore';
import {Colors} from '../theme/colors';
import {formatPace} from '../utils/runMetrics';

const PROFILE_IMAGE = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw_zpHZ2KnGIz5vADzzvKqgSwBNlMb_80kQgwpfJ4Wlg5JJfgY6mKT1803P7OdQoQYfrJ8inPARgQBxDfkeHnmb_aUAanvP8kJOmfVRaUVFI1VTO-oWeq3_lcfXr9gu8vtLLU9qIV8CNCjpxHSEphKIHYbHod8mhwEZGNJlYZRyNA0pOvsmyh0_5ckZd3W9hFTfDCmiz3b6ufYPlBXxnH6ytQ6Qf6OfMqo7ErhgEx6U7l-en9ApVOwwUJun1tUeqPQhzSFmzoWUPdj',
};

const WEEKLY_BARS = [
  {day: 'MON', height: '40%', active: false},
  {day: 'TUE', height: '65%', active: false},
  {day: 'WED', height: '30%', active: false},
  {day: 'THU', height: '90%', active: true},
  {day: 'FRI', height: '50%', active: false},
  {day: 'SAT', height: '75%', active: false},
  {day: 'SUN', height: '15%', active: false},
] as const;

const ACHIEVEMENTS = [
  {
    title: 'CENTURY CLUB',
    caption: '100 Runs Completed',
    icon: 'ribbon',
    color: Colors.primary,
  },
  {
    title: 'SONIC BOOM',
    caption: 'Sub 4:00 Pace 5K',
    icon: 'speedometer',
    color: Colors.secondary,
  },
  {
    title: 'APEX HUNTER',
    caption: '10,000m Elevation',
    icon: 'flag',
    color: Colors.tertiary,
  },
  {
    title: 'MARATHONER',
    caption: 'Locked: 42.2K Run',
    icon: 'people',
    color: Colors.outlineVariant,
  },
] as const;

const ProfileScreen = () => {
  const profile = useUserStore(state => state.profile);
  const stats = useUserStore(state => state.stats);
  const weeklyStats = useUserStore(state => state.weeklyStats);
  const isLoading = useUserStore(state => state.isLoading);
  const refreshDashboard = useUserStore(state => state.refreshDashboard);
  const [refreshing, setRefreshing] = useState(false);

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

  const displayName = (profile?.name || 'Runner').toUpperCase();
  const location = profile?.location?.city
    ? `${profile.location.city}${profile.location.state ? `, ${profile.location.state}` : ''}`
    : 'LOCATION NOT SYNCED';
  const joined = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      }).toUpperCase()
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryContainer}
          />
        }>
        <View style={styles.hero}>
          <View style={styles.avatarGlow} />
          <View style={styles.avatarRing}>
            <Image source={PROFILE_IMAGE} style={styles.profileImage} />
          </View>
          <View style={styles.boltBadge}>
            <Ionicons name="flash" size={18} color={Colors.surface} />
          </View>
        </View>

        <View style={styles.identity}>
          <Text style={styles.tierChip}>ELITE TIER</Text>
          <Text adjustsFontSizeToFit numberOfLines={2} style={styles.name}>
            {displayName}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>LOCATION</Text>
              <Text style={styles.metaValue}>{location}</Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>JOINED</Text>
              <Text style={styles.metaValue}>{joined}</Text>
            </View>
          </View>
        </View>

        <View style={styles.lifetimeCard}>
          <View style={styles.cardTop}>
            <Text style={styles.primaryLabel}>LIFETIME DISTANCE</Text>
            <Ionicons name="sparkles" size={40} color={Colors.primary + '33'} />
          </View>
          <View style={styles.distanceLine}>
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.lifetimeValue}>
              {Math.round(totalDistance).toLocaleString()}
            </Text>
            <Text style={styles.kmUnit}>KM</Text>
          </View>
          <View style={styles.trendLine}>
            <Ionicons name="trending-up" size={14} color={Colors.secondary} />
            <Text style={styles.trendText}>+{weeklyDistance.toFixed(1)}% vs last month</Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          {statTiles.map(tile => (
            <View
              key={tile.label}
              style={[styles.statTile, {borderLeftColor: tile.color}]}>
              <Text style={[styles.statLabel, {color: tile.color}]}>
                {tile.label}
              </Text>
              <Text style={styles.statValue}>{tile.value}</Text>
              <Text style={styles.statCaption}>{tile.caption}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.primaryLabel}>PERFORMANCE VIEW</Text>
              <Text style={styles.chartTitle}>WEEKLY{'\n'}VOLUME</Text>
            </View>
            <View style={styles.chartToggleRow}>
              <Text style={styles.toggleGhost}>LITRES</Text>
              <Text style={styles.toggleActive}>KILOMETERS</Text>
            </View>
          </View>
          <View style={styles.barRow}>
            {WEEKLY_BARS.map(bar => (
              <View key={bar.day} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    {height: bar.height},
                    bar.active && styles.barActive,
                  ]}
                />
                <Text style={[styles.barLabel, bar.active && styles.barLabelActive]}>
                  {bar.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.achievementHeader}>
          <Text style={styles.achievementTitle}>KINETIC{'\n'}ACHIEVEMENTS</Text>
          <TouchableOpacity activeOpacity={0.75}>
            <Text style={styles.viewAll}>VIEW{'\n'}ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.achievementGrid}>
          {ACHIEVEMENTS.map(item => (
            <View key={item.title} style={styles.achievementCard}>
              <View style={[styles.achievementIcon, {shadowColor: item.color}]}>
                <Ionicons name={item.icon} size={26} color={item.color} />
              </View>
              <Text style={styles.achievementName}>{item.title}</Text>
              <Text style={styles.achievementCaption}>{item.caption}</Text>
            </View>
          ))}
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
  content: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 24,
  },
  hero: {
    alignSelf: 'center',
    width: 176,
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  avatarGlow: {
    position: 'absolute',
    width: 174,
    height: 174,
    borderRadius: 87,
    backgroundColor: Colors.secondary + '12',
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  avatarRing: {
    width: 154,
    height: 154,
    borderRadius: 77,
    padding: 4,
    borderWidth: 4,
    borderColor: Colors.primary + '99',
    backgroundColor: Colors.surfaceContainerLowest,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 72,
  },
  boltBadge: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  identity: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 36,
  },
  tierChip: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    color: Colors.tertiary,
    backgroundColor: Colors.tertiaryContainer + '24',
    borderWidth: 1,
    borderColor: Colors.tertiary + '44',
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  name: {
    marginTop: 14,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: {width: 2, height: 3},
    textShadowRadius: 0,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 34,
    marginTop: 14,
  },
  metaBlock: {
    alignItems: 'center',
  },
  metaLabel: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  metaValue: {
    marginTop: 4,
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    fontWeight: '800',
  },
  lifetimeCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
    backgroundColor: Colors.surfaceContainerLow,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryLabel: {
    color: Colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  distanceLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  lifetimeValue: {
    flexShrink: 1,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 70,
    lineHeight: 76,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: '#000000',
    textShadowOffset: {width: 2, height: 4},
    textShadowRadius: 0,
  },
  kmUnit: {
    marginLeft: 2,
    marginBottom: 9,
    color: Colors.primary,
    fontFamily: 'Lexend-Black',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  trendLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },
  trendText: {
    color: Colors.secondary,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    fontWeight: '800',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 36,
  },
  statTile: {
    width: '47.8%',
    minHeight: 126,
    borderRadius: 22,
    padding: 18,
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderLeftWidth: 3,
  },
  statLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  statValue: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  statCaption: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
  },
  chartCard: {
    minHeight: 300,
    borderRadius: 24,
    padding: 24,
    marginBottom: 34,
    backgroundColor: Colors.surfaceContainerLow,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  chartTitle: {
    marginTop: 8,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  chartToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleGhost: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    color: Colors.onSurfaceVariant,
    backgroundColor: Colors.surfaceContainerHigh,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    fontWeight: '800',
  },
  toggleActive: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    color: Colors.onPrimaryFixed,
    backgroundColor: Colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    fontWeight: '800',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 170,
    gap: 8,
    marginTop: 26,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    minHeight: 8,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: Colors.primary + '2E',
  },
  barActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  barLabel: {
    marginTop: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    fontWeight: '800',
  },
  barLabelActive: {
    color: Colors.primary,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  achievementTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  viewAll: {
    color: Colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
    textAlign: 'right',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '47.8%',
    minHeight: 126,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  achievementIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: Colors.surfaceContainerHighest,
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  achievementName: {
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  achievementCaption: {
    marginTop: 4,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Regular',
    fontSize: 8,
    textAlign: 'center',
  },
  footerSpace: {
    height: 116,
  },
});

export default ProfileScreen;
