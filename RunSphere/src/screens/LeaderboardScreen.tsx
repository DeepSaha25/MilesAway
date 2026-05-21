import React, {useCallback, useMemo, useState} from 'react';
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
import AppHeader from '../components/AppHeader';
import {LeaderboardLevel, TimePeriod} from '../services/leaderboardService';
import {useLeaderboardStore} from '../store/leaderboardStore';
import {Colors} from '../theme/colors';

const scopeTabs: {label: string; value: LeaderboardLevel}[] = [
  {label: 'Local', value: 'local'},
  {label: 'City', value: 'city'},
  {label: 'District', value: 'district'},
];

const LeaderboardScreen = () => {
  const [scope, setScope] = useState<LeaderboardLevel>('local');
  const period: TimePeriod = 'weekly';
  const loadLeaderboard = useLeaderboardStore(state => state.loadLeaderboard);
  const entriesState = useLeaderboardStore(state => state.entries);
  const ranksState = useLeaderboardStore(state => state.ranks);
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
  const currentRank = ranksState[currentKey];

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

  const podiumEntries = useMemo(() => {
    const topThree = entries.slice(0, 3);
    return [topThree[1], topThree[0], topThree[2]].filter(Boolean);
  }, [entries]);

  const rows = useMemo(() => {
    return entries.slice(3, 12).map((entry: any, index: number) => ({
      rank: entry.rank || index + 4,
      name: entry.name,
      totalDistance: Number(entry.totalDistance || 0),
      totalRuns: Number(entry.totalRuns || 0),
    }));
  }, [entries]);

  const motivationCopy = useMemo(() => {
    if (!currentRank) {
      return 'Complete a verified run to join the local board.';
    }

    const yourEntry = entries.find(
      (entry: any) => entry.you || Number(entry.rank) === Number(currentRank),
    );
    const runnerAhead = entries.find(
      (entry: any) => Number(entry.rank) === Number(currentRank) - 1,
    );

    if (yourEntry && runnerAhead) {
      const gap =
        Number(runnerAhead.totalDistance || 0) -
        Number(yourEntry.totalDistance || 0);

      if (gap > 0) {
        return `Run ${gap.toFixed(1)} km to catch ${runnerAhead.name}.`;
      }
    }

    return currentRank === 1
      ? 'You are leading this board. Keep the streak alive.'
      : 'Complete another run to climb.';
  }, [currentRank, entries]);

  if (loading && entries.length === 0) {
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
        <View style={styles.headingWrap}>
          <Text style={styles.ghostTitle}>RANKS</Text>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>See how you rank near you this week</Text>
        </View>

        <View style={styles.tabs}>
          {scopeTabs.map(tab => (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tab, scope === tab.value && styles.tabActive]}
              onPress={() => setScope(tab.value)}>
              <Text style={[styles.tabText, scope === tab.value && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.motivationCard}>
          <Text style={styles.motivationLabel}>
            {currentRank ? `Your rank: #${currentRank}` : 'Your rank'}
          </Text>
          <Text style={styles.motivationText}>{motivationCopy}</Text>
        </View>

        {error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Leaderboard unavailable</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptyText}>
              Complete a verified GPS run to unlock this board.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.podium}>
              {podiumEntries.map((item: any) => {
            const isWinner = item.rank === 1;
            return (
              <View key={item.userId || item.rank} style={styles.podiumItem}>
                <View style={[styles.podiumGlow, isWinner && styles.podiumGlowWinner]} />
                <View style={[styles.podiumAvatarWrap, isWinner && styles.winnerAvatarWrap]}>
                  <Text style={styles.podiumInitial}>
                    {(item.name || 'R').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.rankBadge, isWinner && styles.rankBadgeWinner]}>
                  <Text style={styles.rankBadgeText}>{item.rank}</Text>
                </View>
                <Text style={[styles.podiumName, isWinner && styles.podiumNameWinner]}>
                  {item.name}
                </Text>
                <Text style={[styles.podiumDistance, isWinner && styles.podiumDistanceWinner]}>
                  {Number(item.totalDistance || 0).toFixed(1)} <Text style={styles.unitText}>km</Text>
                </Text>
              </View>
            );
              })}
            </View>

            <View style={styles.rows}>
          {rows.map((entry: any) => (
            <View key={`${entry.rank}-${entry.name}`} style={[styles.row, entry.you && styles.youRow]}>
              <View style={styles.rowLeft}>
                <Text style={[styles.rowRank, entry.you && styles.youText]}>
                  {String(entry.rank).padStart(2, '0')}
                </Text>
                <View style={[styles.rowAvatar, entry.you && styles.youAvatar]}>
                  <Text style={styles.rowAvatarText}>{(entry.name || 'R').slice(0, 1)}</Text>
                </View>
                <View>
                  <Text style={styles.rowName}>
                    {entry.name} {entry.you ? <Text style={styles.youBadge}>YOU</Text> : null}
                  </Text>
                  <Text style={[styles.rowMeta, entry.you && styles.youText]}>
                    {entry.you ? 'Your position' : 'Runner'}
                  </Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.rowDistance, entry.you && styles.youText]}>
                  {Number(entry.totalDistance || 0).toFixed(1)} <Text style={styles.unitText}>km</Text>
                </Text>
                <Text style={styles.rowRuns}>{entry.totalRuns || 0} runs</Text>
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
  container: {flex: 1, backgroundColor: Colors.surface},
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  headingWrap: {
    minHeight: 96,
    justifyContent: 'flex-end',
    marginBottom: 18,
  },
  ghostTitle: {
    position: 'absolute',
    left: -28,
    top: 2,
    color: Colors.onSurface + '12',
    fontFamily: 'Lexend-Bold',
    fontSize: 60,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  title: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 36,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  subtitle: {
    marginTop: 4,
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 28,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  tabText: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  motivationCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '22',
    marginBottom: 30,
  },
  motivationLabel: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  motivationText: {
    color: Colors.onSurface,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 44,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
  },
  podiumGlow: {
    position: 'absolute',
    top: 8,
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: Colors.tertiary + '22',
    shadowColor: Colors.tertiary,
    shadowOpacity: 0.25,
    shadowRadius: 22,
  },
  podiumGlowWinner: {
    width: 118,
    height: 118,
    backgroundColor: Colors.primary + '33',
    shadowColor: Colors.primary,
  },
  podiumAvatarWrap: {
    width: 82,
    height: 82,
    borderRadius: 999,
    padding: 4,
    backgroundColor: Colors.tertiaryDim,
  },
  winnerAvatarWrap: {
    width: 112,
    height: 112,
    backgroundColor: Colors.primary,
  },
  podiumInitial: {
    color: Colors.onPrimaryFixed,
    fontFamily: 'Lexend-Bold',
    fontSize: 30,
    fontWeight: '900',
  },
  rankBadge: {
    marginTop: -20,
    marginLeft: 62,
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
  },
  rankBadgeWinner: {
    backgroundColor: Colors.primary,
  },
  rankBadgeText: {
    color: Colors.onPrimaryFixed,
    fontSize: 13,
    fontWeight: '900',
  },
  podiumName: {
    marginTop: 10,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  podiumNameWinner: {
    color: Colors.primary,
  },
  podiumDistance: {
    marginTop: 5,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  podiumDistanceWinner: {
    fontSize: 28,
  },
  unitText: {
    fontSize: 10,
  },
  rows: {
    gap: 14,
  },
  emptyState: {
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 24,
    marginBottom: 36,
  },
  emptyTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  emptyText: {
    marginTop: 8,
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 22,
  },
  row: {
    borderRadius: 32,
    padding: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  youRow: {
    backgroundColor: Colors.surfaceContainerHigh,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  rowRank: {
    width: 28,
    color: Colors.onSurfaceVariant,
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youAvatar: {
    backgroundColor: Colors.primary,
  },
  rowAvatarText: {
    color: Colors.onSurface,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  rowName: {
    color: Colors.onSurface,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  youBadge: {
    color: Colors.primary,
    fontSize: 10,
  },
  rowMeta: {
    marginTop: 4,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowDistance: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rowRuns: {
    marginTop: 3,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '900',
  },
  youText: {
    color: Colors.primary,
  },
  footerSpace: {
    height: 120,
  },
});

export default LeaderboardScreen;
