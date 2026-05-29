import React from 'react';
import {
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
import {LinearGradient} from 'expo-linear-gradient';
import AppHeader from '../components/AppHeader';
import HomeSkeleton from '../components/HomeSkeleton';
import {useDashboard} from '../hooks/useDashboard';
import {Colors} from '../theme/colors';

const MAP_TEXTURE = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAF5LWdz8RC7eUJcuirl2S2P_Y3Pg2Dmoj4bj8_5lBXpOdtoKTCP6v2aGO0tI0fWk1o7pAXBDi52OSvWAj3CG5ojn87hHm9bxMO922LqFxUYMwyNcDrLGokmzDagZL0FVoEK_O7jtu1Gmz4rf3ll6LRc7VCmZKnrwTHvoO_zr4Jpisf8BMYMxuFLEVlnL4P6002dSifY3V07DshEYlPFpS7gZRKq0_ltCTFjHjM6fdl29nyu_PSJG_rFjkhAaJ5ARfcfz5QuVgcKvCD',
};

const HomeScreen = ({navigation}: any) => {
  const dashboard = useDashboard();

  if (dashboard.isInitialLoading) {
    return <HomeSkeleton />;
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
              refreshing={dashboard.refreshing}
              onRefresh={dashboard.onRefresh}
              tintColor={Colors.primaryContainer}
            />
          }>
          {dashboard.dashboardStatus === 'ERROR' ? (
            <View style={styles.retryBanner}>
              <View style={styles.retryCopy}>
                <Text style={styles.retryTitle}>Dashboard not refreshed</Text>
                <Text style={styles.retryText}>
                  {dashboard.dashboardError ||
                    'Showing saved data from your last refresh.'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.retryButton}
                onPress={dashboard.onRetryDashboard}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.hero}>
            <Text style={styles.heroLabel}>TODAY'S DISTANCE</Text>
            <View style={styles.distanceRow}>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.distance}>
                {dashboard.displayDistance}
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
              <Text style={styles.cardLabel}>LAST SAVED RUN</Text>
              <Text style={styles.runName}>
                {dashboard.lastRunLabel}
              </Text>
            </View>
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.paceValue}>{dashboard.lastPace}</Text>
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
                {dashboard.activeHours.toFixed(1)} <Text style={styles.hoursUnit}>HRS</Text>
              </Text>
            </View>
            <View>
              <View style={styles.goalHeader}>
                <Text style={styles.microLabel}>GOAL: {dashboard.weeklyHoursGoal.toFixed(1)} HRS</Text>
                <View style={styles.goalControls}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.goalButton}
                    onPress={dashboard.decreaseWeeklyGoal}
                    accessibilityLabel="Decrease weekly active time goal">
                    <Ionicons name="remove" size={16} color={Colors.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.goalButton}
                    onPress={dashboard.increaseWeeklyGoal}
                    accessibilityLabel="Increase weekly active time goal">
                    <Ionicons name="add" size={16} color={Colors.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {width: `${dashboard.activeProgress}%`}]} />
              </View>
              <View style={styles.progressMeta}>
                <Text style={styles.microLabel}>THIS WEEK</Text>
                <Text style={styles.progressPercent}>
                  {Math.round(dashboard.activeProgress)}% ACHIEVED
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.cardLabel}>GLOBAL RANK</Text>
              <Text style={styles.rankValue}>{dashboard.rank ? `#${dashboard.rank}` : '--'}</Text>
            </View>
            <Text style={styles.rankHelp}>
              {dashboard.rank
                ? 'Based on your verified saved runs.'
                : 'Join the global board now, then run to climb higher.'}
            </Text>
          </View>

          <View style={styles.signaturePanel}>
            <View style={styles.signatureArt}>
              <View style={styles.signatureLine} />
              <View style={[styles.signatureLine, styles.signatureLineAlt]} />
            </View>
            <Text style={styles.signatureHash}>#MilesAway</Text>
            <View style={styles.signatureCopy}>
              <Text style={styles.signatureText}>Crafted in Kolkata 🇮🇳 </Text>
              <Text style={styles.signatureText}> For the #Runners Of the World ❤️</Text>
            </View>
          </View>

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
  retryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    borderRadius: 18,
    padding: 14,
    backgroundColor: Colors.surfaceContainerHigh + 'F2',
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  retryCopy: {
    flex: 1,
  },
  retryTitle: {
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  retryText: {
    marginTop: 4,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 17,
  },
  retryButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
  },
  retryButtonText: {
    color: Colors.onPrimaryFixed,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    fontWeight: '900',
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
  goalHeader: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  goalControls: {
    flexDirection: 'row',
    gap: 8,
  },
  goalButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: Colors.secondary + '33',
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
  signaturePanel: {
    minHeight: 250,
    overflow: 'hidden',
    marginTop: 0,
    marginBottom: 22,
    paddingHorizontal: 4,
    paddingBottom: 28,
    justifyContent: 'flex-end',
  },
  signatureArt: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  signatureIcon: {
    position: 'absolute',
  },
  signaturePin: {
    left: 20,
    top: 54,
    transform: [{rotate: '-12deg'}],
  },
  signatureSteps: {
    right: 32,
    top: 38,
    transform: [{rotate: '18deg'}],
  },
  signatureTrail: {
    left: 92,
    bottom: 106,
    transform: [{rotate: '7deg'}],
  },
  signatureWorld: {
    right: -8,
    bottom: 74,
  },
  signatureLine: {
    position: 'absolute',
    left: 8,
    right: 4,
    top: 92,
    height: 2,
    borderRadius: 2,
    backgroundColor: Colors.onSurfaceVariant + '0C',
    transform: [{rotate: '-5deg'}],
  },
  signatureLineAlt: {
    top: 150,
    left: 0,
    right: 24,
    backgroundColor: Colors.primary + '0D',
    transform: [{rotate: '6deg'}],
  },
  signatureHash: {
    color: Colors.onSurfaceVariant + '34',
    fontFamily: 'Lexend-Black',
    fontSize: 46,
    lineHeight: 54,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  signatureCopy: {
    marginTop: 12,
    gap: 8,
  },
  signatureText: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '800',
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
