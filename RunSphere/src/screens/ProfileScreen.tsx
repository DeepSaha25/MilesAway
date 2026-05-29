import React from 'react';
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
import Ionicons from '@expo/vector-icons/Ionicons';
import AppHeader from '../components/AppHeader';
import Avatar from '../components/Avatar';
import MiniRoutePreview from '../components/MiniRoutePreview';
import {useProfileLocation} from '../hooks/useProfileLocation';
import {Colors} from '../theme/colors';
import {
  formatClock,
  formatDistance,
  formatPace,
  formatRunDate,
} from '../utils/runMetrics';

const ProfileScreen = () => {
  const profileData = useProfileLocation();

  if (profileData.isInitialLoading) {
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
            refreshing={profileData.refreshing}
            onRefresh={profileData.onRefresh}
            tintColor={Colors.primaryContainer}
          />
        }>
        <View style={styles.hero}>
          <View style={styles.avatarGlow} />
          <View style={styles.avatarRing}>
            <Avatar
              uri={profileData.profile?.avatar}
              name={profileData.profile?.name}
              size={104}
              borderColor={Colors.transparent}
            />
          </View>
        </View>

        <View style={styles.identity}>
          <Text adjustsFontSizeToFit numberOfLines={2} style={styles.name}>
            {profileData.displayName}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBlock}>
              <View style={styles.metaLabelRow}>
                <Text style={styles.metaLabel}>LOCATION</Text>
                <TouchableOpacity
                  activeOpacity={0.78}
                  style={styles.locationIconButton}
                  onPress={profileData.refreshLocation}
                  disabled={profileData.locating}
                  accessibilityLabel="Refresh location">
                  {profileData.locating ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Ionicons
                      name="refresh"
                      size={14}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              </View>
              <Text numberOfLines={1} style={styles.metaValue}>
                {profileData.location}
              </Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.metaLabel}>JOINED</Text>
              <Text style={styles.metaValue}>{profileData.joined}</Text>
            </View>
          </View>
        </View>

        <View style={styles.lifetimeCard}>
          <View style={styles.cardTop}>
            <Text style={styles.primaryLabel}>LIFETIME DISTANCE</Text>
        
          </View>
          <View style={styles.distanceLine}>
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.lifetimeValue}>
              {formatDistance(profileData.totalDistance, true)}
            </Text>
            <Text style={styles.kmUnit}>KM</Text>
          </View>
          <View style={styles.trendLine}>
            <Ionicons name="calendar" size={14} color={Colors.secondary} />
            <Text style={styles.trendText}>
              {formatDistance(profileData.weeklyDistance, true)} km this week
            </Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          {profileData.statTiles.map(tile => (
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
              <Text style={styles.chartTitle}>THIS WEEK'S{'\n'}DISTANCE</Text>
            </View>
            <View style={styles.chartToggleRow}>
              <Text style={styles.toggleActive}>KILOMETERS</Text>
            </View>
          </View>
          <View style={styles.barRow}>
            {profileData.weeklyDistance > 0 ? (
              <View style={styles.weeklyTotalBlock}>
                <Text style={styles.weeklyTotalValue}>
                  {formatDistance(profileData.weeklyDistance, true)}
                </Text>
                <Text style={styles.weeklyTotalLabel}>KM THIS WEEK</Text>
              </View>
            ) : (
              <View style={styles.weeklyEmptyBlock}>
                <Text style={styles.weeklyEmptyTitle}>NO RUNS THIS WEEK YET</Text>
                <Text style={styles.weeklyEmptyText}>
                  Your weekly distance appears after your next saved run.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>RECENT{'\n'}RUNS</Text>
        </View>

        {profileData.recentRuns.length === 0 ? (
          <View style={styles.recentEmpty}>
            <Ionicons name="footsteps" size={28} color={Colors.primary} />
            <Text style={styles.recentEmptyTitle}>NO SAVED RUNS YET</Text>
            <Text style={styles.recentEmptyText}>
              Completed runs will appear here automatically.
            </Text>
          </View>
        ) : (
          profileData.recentRuns.slice(0, 4).map((run, index) => {
            const pace =
              run.averagePace || (run.avgSpeed ? 60 / run.avgSpeed : 0);

            return (
              <View key={`${run._id || run.date}-${index}`} style={styles.recentCard}>
                <MiniRoutePreview
                  coordinates={run.coordinates || []}
                  style={styles.recentRoute}
                />
                <View style={styles.recentCardHeader}>
                  <View style={styles.recentDistanceBlock}>
                    <Text style={styles.recentDistance}>
                      {formatDistance(Number(run.distance || 0))}
                    </Text>
                    <Text style={styles.recentDistanceUnit}>KM</Text>
                  </View>
                  <View style={styles.recentLocationBadge}>
                    <Text numberOfLines={1} style={styles.recentLocationText}>
                      {run.location?.city || 'OUTDOOR'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recentDate}>
                  {formatRunDate(run.date || run.endTime || new Date())}
                </Text>
                <View style={styles.recentMetrics}>
                  <View style={styles.recentMetric}>
                    <Text style={styles.recentMetricLabel}>TIME</Text>
                    <Text style={styles.recentMetricValue}>
                      {formatClock(run.duration || 0)}
                    </Text>
                  </View>
                  <View style={styles.recentMetric}>
                    <Text style={styles.recentMetricLabel}>PACE</Text>
                    <Text style={styles.recentMetricValue}>{formatPace(pace)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        

        

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
    paddingTop: 6,
    paddingBottom: 24,
  },
  hero: {
    alignSelf: 'center',
    width: 118,
    height: 118,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  avatarGlow: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: Colors.secondary + '0D',
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    borderWidth: 2,
    borderColor: Colors.primary + '80',
    backgroundColor: Colors.surfaceContainerLowest,
    overflow: 'hidden',
  },
  identity: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 22,
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
    marginTop: 4,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: {width: 2, height: 3},
    textShadowRadius: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    width: '100%',
  },
  metaBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  metaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  locationIconButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '12',
    borderWidth: 1,
    borderColor: Colors.primary + '3D',
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
  weeklyTotalBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  weeklyTotalValue: {
    color: Colors.primary,
    fontFamily: 'Lexend-Black',
    fontSize: 56,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  weeklyTotalLabel: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  weeklyEmptyBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    padding: 24,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  weeklyEmptyTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  weeklyEmptyText: {
    marginTop: 8,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },
  recentHeader: {
    marginBottom: 18,
  },
  recentTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  recentEmpty: {
    minHeight: 126,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    marginBottom: 34,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  recentEmptyTitle: {
    marginTop: 10,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recentEmptyText: {
    marginTop: 6,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },
  recentCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '22',
  },
  recentRoute: {
    height: 118,
    marginBottom: 14,
  },
  recentCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  recentDistanceBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  recentDistance: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  recentDistanceUnit: {
    marginLeft: 4,
    marginBottom: 4,
    color: Colors.primary,
    fontFamily: 'Lexend-Black',
    fontSize: 13,
    fontWeight: '900',
  },
  recentLocationBadge: {
    maxWidth: 120,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  recentLocationText: {
    color: Colors.secondary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  recentDate: {
    marginTop: 4,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  recentMetrics: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  recentMetric: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  recentMetricLabel: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  recentMetricValue: {
    marginTop: 5,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 13,
    fontWeight: '900',
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
  achievementEmpty: {
    minHeight: 126,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: Colors.surfaceContainerHigh,
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
