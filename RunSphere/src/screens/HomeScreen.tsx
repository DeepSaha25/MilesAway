import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  ImageBackground,
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
import {LinearGradient} from 'expo-linear-gradient';
import AppHeader from '../components/AppHeader';
import {useLeaderboardStore} from '../store/leaderboardStore';
import {useUserStore} from '../store/userStore';
import {Colors} from '../theme/colors';
import {formatPace} from '../utils/runMetrics';

const MAP_TEXTURE = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAF5LWdz8RC7eUJcuirl2S2P_Y3Pg2Dmoj4bj8_5lBXpOdtoKTCP6v2aGO0tI0fWk1o7pAXBDi52OSvWAj3CG5ojn87hHm9bxMO922LqFxUYMwyNcDrLGokmzDagZL0FVoEK_O7jtu1Gmz4rf3ll6LRc7VCmZKnrwTHvoO_zr4Jpisf8BMYMxuFLEVlnL4P6002dSifY3V07DshEYlPFpS7gZRKq0_ltCTFjHjM6fdl29nyu_PSJG_rFjkhAaJ5ARfcfz5QuVgcKvCD',
};

const LIVE_MAP = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBO0nxRiiaFGe7NcBsFC1eRj1kr69dZxt7uTuvWhWVY3W-v36lPyNB3IG2rVIIsoBNtEUVj8wDZBmxplxlQFJZuQQ6rZnMT5Z67WIBArgTBQ0lt3ZMtLFsbJjslBPs_FzKJ_COLG_sowbyiKswrqcWbiMOwYB1ru7JcalIj1UPcnA5X6FRKo5egC-oYWBjLG65VIu-ot_YWThX7o7ruwGgN_IDVDDoi6KJQHIORBId_z1_TD8hqAJLnf-tnsUq5bfpmqooQFhh2sKWb',
};

const HomeScreen = ({navigation}: any) => {
  const profile = useUserStore(state => state.profile);
  const dailyStats = useUserStore(state => state.dailyStats);
  const weeklyStats = useUserStore(state => state.weeklyStats);
  const recentRuns = useUserStore(state => state.recentRuns);
  const refreshDashboard = useUserStore(state => state.refreshDashboard);
  const isLoading = useUserStore(state => state.isLoading);
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
  const dailyDistance = Number(dailyStats?.totalDistance || 0);
  const weeklyHours = Number(weeklyStats?.totalDuration || 0) / 3600;
  const displayDistance = dailyDistance.toFixed(1);
  const activeHours = weeklyHours;
  const activeProgress = Math.min(100, (activeHours / 6) * 100);
  const rank = leaderboardRanks['local:today'] ?? null;
  const lastPace = lastRun
    ? formatPace(
        lastRun.averagePace || (lastRun.avgSpeed ? 60 / lastRun.avgSpeed : 0),
      )
    : '--';

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

      <ImageBackground
        source={MAP_TEXTURE}
        resizeMode="cover"
        style={styles.shell}
        imageStyle={styles.mapTexture}>
        <View style={styles.scrim} />

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
            <Text style={styles.heroLabel}>TODAY'S DISTANCE</Text>
            <View style={styles.distanceRow}>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.distance}>
                {displayDistance}
              </Text>
              <Text style={styles.distanceUnit}>KM</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('RunTracking')}
            style={styles.startWrap}
            accessibilityLabel="Start run">
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.startButton}>
              <Text style={styles.startText}>START RUN</Text>
              <Ionicons name="play" size={26} color={Colors.onPrimaryFixed} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.card}>
            <View>
              <Text style={styles.cardLabel}>LAST PERFORMANCE</Text>
              <Text style={styles.runName}>
                {lastRun ? 'Latest Run' : 'No runs yet'}
              </Text>
            </View>
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.paceValue}>{lastPace}</Text>
                <Text style={styles.microLabel}>PACE / KM</Text>
              </View>
              <View style={styles.trendButton}>
                <Ionicons name="trending-up" size={28} color={Colors.primary} />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.cardLabel}>ACTIVE TIME / WEEK</Text>
              <Text style={styles.hoursValue}>
                {activeHours.toFixed(1)} <Text style={styles.hoursUnit}>HRS</Text>
              </Text>
            </View>
            <View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {width: `${activeProgress}%`}]} />
              </View>
              <View style={styles.progressMeta}>
                <Text style={styles.microLabel}>GOAL: 6.0 HRS</Text>
                <Text style={styles.progressPercent}>
                  {Math.round(activeProgress)}% ACHIEVED
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.cardLabel}>LOCAL SQUAD RANK</Text>
              <Text style={styles.rankValue}>{rank ? `#${rank}` : '--'}</Text>
            </View>
            <Text style={styles.rankHelp}>
              {rank
                ? 'Based on your verified saved runs.'
                : 'Save a verified run while logged in to enter leaderboards.'}
            </Text>
          </View>

          <ImageBackground
            source={LIVE_MAP}
            resizeMode="cover"
            imageStyle={styles.liveMapImage}
            style={styles.liveCard}>
            <View style={styles.liveOverlay} />
            <View style={styles.liveContent}>
              <View style={styles.liveTitleRow}>
                <View style={styles.liveDot} />
              <Text style={styles.liveTitle}>LIVE TRACKING ACTIVE</Text>
            </View>
            <Text style={styles.liveCopy}>
                Start a run to capture your route, pace, and distance.
            </Text>
            </View>
          </ImageBackground>

          <View style={styles.footerSpace} />
        </ScrollView>
      </ImageBackground>
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
  shell: {
    flex: 1,
  },
  mapTexture: {
    opacity: 0.2,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,14,15,0.56)',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 28,
  },
  hero: {
    marginBottom: 34,
  },
  heroLabel: {
    color: Colors.primary + '99',
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  distance: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 88,
    lineHeight: 96,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: '#000000',
    textShadowOffset: {width: 2, height: 4},
    textShadowRadius: 0,
  },
  distanceUnit: {
    marginLeft: 4,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Lexend-Black',
    fontSize: 24,
    fontWeight: '900',
  },
  startWrap: {
    alignSelf: 'flex-start',
    marginBottom: 48,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 12,
  },
  startButton: {
    minWidth: 278,
    height: 78,
    borderRadius: 39,
    paddingHorizontal: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  startText: {
    color: Colors.onPrimaryFixed,
    fontFamily: 'Lexend-Black',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 2.2,
  },
  card: {
    minHeight: 226,
    borderRadius: 26,
    paddingHorizontal: 32,
    paddingVertical: 34,
    marginBottom: 26,
    backgroundColor: Colors.surfaceContainer + 'F8',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  runName: {
    marginTop: 14,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: '#000000',
    textShadowOffset: {width: 2, height: 3},
    textShadowRadius: 0,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  paceValue: {
    color: Colors.primary,
    fontFamily: 'Lexend-Black',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    textShadowColor: Colors.onSurface,
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 0,
  },
  microLabel: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 0.7,
  },
  trendButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
  },
  hoursValue: {
    marginTop: 12,
    color: Colors.secondary,
    fontFamily: 'Lexend-Black',
    fontSize: 52,
    lineHeight: 60,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  hoursUnit: {
    fontSize: 16,
    color: Colors.secondary,
  },
  progressTrack: {
    height: 13,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLowest,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.secondary,
  },
  progressMeta: {
    marginTop: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPercent: {
    color: Colors.secondary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '800',
  },
  rankValue: {
    marginTop: 16,
    color: Colors.tertiary,
    fontFamily: 'Lexend-Black',
    fontSize: 52,
    lineHeight: 60,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rankHelp: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 20,
  },
  liveCard: {
    height: 300,
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'flex-end',
    backgroundColor: Colors.surfaceContainerLow,
  },
  liveMapImage: {
    borderRadius: 26,
  },
  liveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  liveContent: {
    paddingHorizontal: 32,
    paddingBottom: 34,
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  liveDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: Colors.primary,
  },
  liveTitle: {
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  liveCopy: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  footerSpace: {
    height: 116,
  },
});

export default HomeScreen;
