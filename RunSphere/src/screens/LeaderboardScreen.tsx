import React, {useCallback, useMemo, useState} from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import Avatar from '../components/Avatar';
import LeaderboardSkeleton from '../components/LeaderboardSkeleton';
import {LeaderboardLevel, TimePeriod} from '../services/leaderboardService';
import {useLeaderboardStore} from '../store/leaderboardStore';
import {Colors} from '../theme/colors';
import {formatDistance} from '../utils/runMetrics';

const scopeTabs: {label: string; value: LeaderboardLevel}[] = [
  {label: 'Global', value: 'global'},
  {label: 'City', value: 'city'},
  {label: 'District', value: 'district'},
  {label: 'State', value: 'state'},
];

const LeaderboardScreen = () => {
  const [scope, setScope] = useState<LeaderboardLevel>('global');
  const period: TimePeriod = 'weekly';
  const loadLeaderboard = useLeaderboardStore(state => state.loadLeaderboard);
  const entriesState = useLeaderboardStore(state => state.entries);
  const loadingState = useLeaderboardStore(state => state.loading);
  const errorsState = useLeaderboardStore(state => state.errors);
  const [refreshing, setRefreshing] = useState(false);

  const currentKey = `${scope}:${period}` as const;
  const entries = useMemo(
    () => entriesState[currentKey] || [],
    [currentKey, entriesState],
  );
  const loading = loadingState[currentKey];
  const error = errorsState[currentKey];

  const loadCurrent = useCallback(async () => {
    await loadLeaderboard(scope, period, 30);
  }, [loadLeaderboard, scope]);

  useFocusEffect(
    useCallback(() => {
      loadCurrent();
    }, [loadCurrent]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCurrent();
    } finally {
      setRefreshing(false);
    }
  };

  const rows = useMemo(() => {
    if (entries.length > 0) {
      const listEntries = entries.length >= 3 ? entries.slice(3) : entries;
      return listEntries.map((entry: any, index: number) => ({
        rank: entry.rank || index + 1,
        name: entry.name,
        avatar: entry.avatar,
        totalDistance: Number(entry.totalDistance || 0),
        totalRuns: Number(entry.totalRuns || 0),
        you: entry.you,
      }));
    }

    return [];
  }, [entries]);

  const podium = useMemo(() => {
    if (entries.length < 3) {
      return [];
    }

    const topThree = entries.slice(0, 3);
    return [topThree[1], topThree[0], topThree[2]].map((entry: any, index) => ({
      rank: entry.rank || [2, 1, 3][index],
      name: entry.name,
      avatar: entry.avatar,
      totalDistance: Number(entry.totalDistance || 0),
      totalRuns: Number(entry.totalRuns || 0),
      you: entry.you,
    }));
  }, [entries]);

  if (loading && entries.length === 0) {
    return <LeaderboardSkeleton />;
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
        <View style={styles.headingWrap}>
          <Text style={styles.ghostTitle}>RANKS</Text>
          <Text style={styles.title}>THE ELITE</Text>
      
        </View>

        <View style={styles.tabs}>
          {scopeTabs.map(tab => (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tab, scope === tab.value && styles.tabActive]}
              onPress={() => setScope(tab.value)}
              activeOpacity={0.8}>
              <Text style={[styles.tabText, scope === tab.value && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {entries.length === 0 ? (
          <View style={styles.emptyBoard}>
            <Text style={styles.emptyTitle}>NO RUNNERS YET</Text>
            <Text style={styles.emptyText}>
              New members appear here as soon as they join. Start a run to climb the board.
            </Text>
          </View>
        ) : (
          <>
            {podium.length === 3 ? (
              <View style={styles.podium}>
                {podium.map((entry: any) => {
                  const isWinner = Number(entry.rank) === 1;
                  const isSecond = Number(entry.rank) === 2;
                  const isThird = Number(entry.rank) === 3;

                  return (
                    <View
                      key={`${entry.rank}-${entry.name}`}
                      style={[styles.podiumItem, isWinner && styles.winnerItem]}>
                      <View
                        style={[
                          styles.podiumGlow,
                          isWinner && styles.winnerGlow,
                          isThird && styles.thirdGlow,
                        ]}
                      />
                      <View
                        style={[
                          styles.podiumAvatarShell,
                          isWinner && styles.winnerAvatarShell,
                          isSecond && styles.secondAvatarShell,
                          isThird && styles.thirdAvatarShell,
                        ]}>
                        <Avatar
                          uri={entry.avatar}
                          name={entry.name}
                          size={isWinner ? 84 : 62}
                          borderColor={Colors.transparent}
                        />
                      </View>
                      <View style={[styles.rankBadge, isWinner && styles.winnerBadge]}>
                        <Text
                          style={[
                            styles.rankBadgeText,
                            isWinner && styles.winnerBadgeText,
                          ]}>
                          {entry.rank}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={2}
                        style={[styles.podiumName, isWinner && styles.winnerName]}>
                        {String(entry.name || 'Runner').toUpperCase()}
                      </Text>
                      {entry.you ? <Text style={styles.youPodiumBadge}>YOU</Text> : null}
                      <Text style={[styles.podiumDistance, isWinner && styles.winnerDistance]}>
                        {formatDistance(entry.totalDistance, true)}
                        <Text style={styles.podiumDistanceUnit}> KM</Text>
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.rows}>
              {rows.map((entry: any) => (
                <View
                  key={`${entry.rank}-${entry.name}`}
                  style={[styles.row, entry.you && styles.youRow]}>
                  {entry.you ? <View style={styles.rowGlow} /> : null}
                  <Text style={[styles.rowRank, entry.you && styles.youText]}>
                    {String(entry.rank).padStart(2, '0')}
                  </Text>
                  <Avatar
                    uri={entry.avatar}
                    name={entry.name}
                    size={52}
                    borderColor={Colors.secondary + '55'}
                  />
                  <View style={styles.rowIdentity}>
                    <View style={styles.nameLine}>
                      <Text numberOfLines={2} style={styles.rowName}>
                        {String(entry.name || 'Runner').toUpperCase()}
                      </Text>
                      {entry.you ? <Text style={styles.youBadge}>YOU</Text> : null}
                    </View>
                    <Text style={[styles.rowTier, entry.you && styles.youText]}>
                      {entry.totalRuns || 0} verified runs
                    </Text>
                  </View>
                  <View style={styles.rowDistanceWrap}>
                    <Text style={[styles.rowDistance, entry.you && styles.youText]}>
                      {formatDistance(Number(entry.totalDistance || 0), true)}
                    </Text>
                    <Text style={styles.rowUnit}>KM</Text>
                    <Text style={styles.rowRuns}>{entry.totalRuns || 0} RUNS</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
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
  content: {
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 24,
  },
  headingWrap: {
    minHeight: 88,
    justifyContent: 'flex-end',
    marginBottom: 22,
  },
  ghostTitle: {
    position: 'absolute',
    left: -24,
    top: 2,
    color: Colors.onSurface + '09',
    fontFamily: 'Lexend-Black',
    fontSize: 58,
    lineHeight: 66,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  title: {
    color: Colors.onSurface + 'E0',
    fontFamily: 'Lexend-Black',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: '#000000',
    textShadowOffset: {width: 2, height: 3},
    textShadowRadius: 0,
  },
  subtitle: {
    marginTop: 12,
    color: Colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  tabActive: {
    backgroundColor: Colors.surfaceContainerHigh + 'B8',
  },
  tabText: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  errorCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    backgroundColor: Colors.errorContainer + '66',
  },
  errorText: {
    color: Colors.onErrorContainer,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  emptyBoard: {
    minHeight: 300,
    borderRadius: 34,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    marginBottom: 30,
  },
  emptyTitle: {
    color: Colors.primary,
    fontFamily: 'Lexend-Black',
    fontSize: 30,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  emptyText: {
    marginTop: 10,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  podium: {
    minHeight: 184,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  podiumItem: {
    flex: 1,
    minHeight: 158,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  winnerItem: {
    minHeight: 184,
  },
  podiumGlow: {
    position: 'absolute',
    top: 20,
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: Colors.outlineVariant + '16',
    shadowColor: Colors.outlineVariant,
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  winnerGlow: {
    top: 6,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.primary + '16',
    shadowColor: Colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  thirdGlow: {
    backgroundColor: Colors.tertiary + '14',
    shadowColor: Colors.tertiary,
  },
  podiumAvatarShell: {
    borderRadius: 999,
    padding: 3,
    backgroundColor: Colors.outlineVariant + 'D0',
  },
  winnerAvatarShell: {
    padding: 4,
    backgroundColor: Colors.primary + 'D8',
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  secondAvatarShell: {
    backgroundColor: '#9AA4B2CC',
  },
  thirdAvatarShell: {
    backgroundColor: Colors.tertiary + 'D8',
  },
  rankBadge: {
    marginTop: -13,
    marginLeft: 44,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  winnerBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginLeft: 58,
    borderWidth: 2,
    borderColor: Colors.surface,
    backgroundColor: Colors.primary,
  },
  rankBadgeText: {
    color: Colors.onSurface + 'E8',
    fontFamily: 'Lexend-Black',
    fontSize: 13,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  winnerBadgeText: {
    color: Colors.onPrimaryFixed,
    fontSize: 14,
  },
  podiumName: {
    marginTop: 8,
    minHeight: 28,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  winnerName: {
    color: Colors.primary,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  youPodiumBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: Colors.primary,
    backgroundColor: Colors.primary + '24',
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 4,
  },
  podiumDistance: {
    color: Colors.onSurface + 'E0',
    fontFamily: 'Lexend-Black',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  winnerDistance: {
    fontSize: 22,
    color: Colors.onSurface + 'E8',
  },
  podiumDistanceUnit: {
    fontSize: 10,
  },
  rows: {
    gap: 12,
  },
  row: {
    minHeight: 78,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceContainerHigh + 'E8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  youRow: {
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.surfaceContainerHigh + 'C8',
  },
  rowGlow: {
    position: 'absolute',
    left: -70,
    top: -70,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary + '12',
  },
  rowRank: {
    width: 34,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Lexend-Black',
    fontSize: 21,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rowIdentity: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowName: {
    flexShrink: 1,
    color: Colors.onSurface + 'E8',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  youBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: Colors.primary,
    backgroundColor: Colors.primary + '24',
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '900',
  },
  rowTier: {
    marginTop: 3,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  rowDistanceWrap: {
    alignItems: 'flex-end',
    minWidth: 58,
  },
  rowDistance: {
    color: Colors.onSurface + 'E0',
    fontFamily: 'Lexend-Black',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rowUnit: {
    color: Colors.onSurface + 'D8',
    fontFamily: 'Lexend-Black',
    fontSize: 10,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rowRuns: {
    marginTop: 4,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '800',
  },
  youText: {
    color: Colors.primary,
    textShadowColor: 'rgba(153,247,255,0.6)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 8,
  },
  footerSpace: {
    height: 116,
  },
});

export default LeaderboardScreen;
