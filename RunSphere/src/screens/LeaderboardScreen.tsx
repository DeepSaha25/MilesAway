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
import Avatar from '../components/Avatar';
import {LeaderboardLevel, TimePeriod} from '../services/leaderboardService';
import {useLeaderboardStore} from '../store/leaderboardStore';
import {Colors} from '../theme/colors';

const scopeTabs: {label: string; value: LeaderboardLevel}[] = [
  {label: 'Local', value: 'local'},
  {label: 'City', value: 'city'},
  {label: 'District', value: 'district'},
  {label: 'State', value: 'state'},
];

const LeaderboardScreen = () => {
  const [scope, setScope] = useState<LeaderboardLevel>('local');
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
      return entries.map((entry: any, index: number) => ({
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
          <Text style={styles.subtitle}>VERIFIED RUN STANDINGS</Text>
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
            <Text style={styles.emptyTitle}>RUN TO ENTER</Text>
            <Text style={styles.emptyText}>
              Complete a verified GPS run to open your local standing.
            </Text>
          </View>
        ) : (
          <View style={styles.rows}>
            {rows.map((entry: any) => (
              <View
                key={`${entry.rank}-${entry.name}`}
                style={[styles.row, entry.you && styles.youRow]}>
                {entry.you ? <View style={styles.rowGlow} /> : null}
                <Text style={[styles.rowRank, entry.you && styles.youText]}>
                  {String(entry.rank).padStart(2, '0')}
                </Text>
                <Avatar uri={entry.avatar} size={52} borderColor={Colors.secondary + '55'} />
                <View style={styles.rowIdentity}>
                  <View style={styles.nameLine}>
                    <Text numberOfLines={2} style={styles.rowName}>
                      {String(entry.name).toUpperCase()}
                    </Text>
                    {entry.you ? <Text style={styles.youBadge}>YOU</Text> : null}
                  </View>
                  <Text style={[styles.rowTier, entry.you && styles.youText]}>
                    {entry.totalRuns || 0} verified runs
                  </Text>
                </View>
                <View style={styles.rowDistanceWrap}>
                  <Text style={[styles.rowDistance, entry.you && styles.youText]}>
                    {Number(entry.totalDistance || 0).toFixed(1)}
                  </Text>
                  <Text style={styles.rowUnit}>KM</Text>
                  <Text style={styles.rowRuns}>{entry.totalRuns || 0} RUNS</Text>
                </View>
              </View>
            ))}
          </View>
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
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 24,
  },
  headingWrap: {
    minHeight: 128,
    justifyContent: 'flex-end',
    marginBottom: 34,
  },
  ghostTitle: {
    position: 'absolute',
    left: -34,
    top: 0,
    color: Colors.onSurface + '12',
    fontFamily: 'Lexend-Black',
    fontSize: 76,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  title: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 42,
    lineHeight: 46,
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
    padding: 5,
    borderRadius: 30,
    backgroundColor: Colors.surfaceContainerLow,
    marginBottom: 56,
  },
  tab: {
    flex: 1,
    minHeight: 54,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  tabText: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
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
  rows: {
    gap: 20,
  },
  row: {
    minHeight: 116,
    borderRadius: 36,
    paddingHorizontal: 26,
    paddingVertical: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    overflow: 'hidden',
  },
  youRow: {
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.surfaceContainerHigh + 'DD',
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
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rowIdentity: {
    flex: 1,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowName: {
    flexShrink: 1,
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    lineHeight: 24,
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
    marginTop: 4,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  rowDistanceWrap: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  rowDistance: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 30,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rowUnit: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 11,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rowRuns: {
    marginTop: 6,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
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
