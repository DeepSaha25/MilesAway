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
import {LeaderboardLevel, TimePeriod} from '../services/leaderboardService';
import {useLeaderboardStore} from '../store/leaderboardStore';
import {Colors} from '../theme/colors';

const scopeTabs: {label: string; value: LeaderboardLevel}[] = [
  {label: 'Local', value: 'local'},
  {label: 'City', value: 'city'},
  {label: 'District', value: 'district'},
];

const PODIUM_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBK6lFeZVGQdWbmQVUa3t_p9iCUqItME5VDiJMze8T-D6DyqNzavtkKHW80NTu-08RJxq8V85RYX3HvEdNsWnzhwUfnMktsvKUEoVIk5xTpdcEn_6XG8IRJqIw2qOu1NjY1eRuzJLLScDCGQoG1FDWwovobm0mOQxgFVUzCtamV_GkaPk9WPcb77WGLkIJ4rpJAv-AlHDauivnsGI9Ir9ChE3hiG0W1HCKBcwH4lhiIs7iq3nQuqN3UQQAC4mla3ED7TLyTdIIXPahq',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCIiKMTP7hKDof2YMEFR9FK_KLNZ7gz6V1vbcLPuBCoqogZJBs7kBQ1sXic9LbACQQbZ46_qceBEPWx0YjK-rUu9WAw5WOh2mm8a5v22nQ_ckqKEk27005C-Xf4JzZpIWXoAcUtmvw0H8Axn64Uo9PObonwxfdNzqMpntT8qTEfF8oHnQd69YrP2ry_hEj9V0Uq_OcOGEwLTz0C0NDAHLFruSMIAWdGLihsjs7DiRWa7e0L5cuBbeCF95UuuTcTUjZSQI6HRKcwbpOg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCq64-gqunUa5rvuKcdA4aQe477_mesyD9J2MPhJhoG3PALuuqXc6nsG4RxrbpNL6VjOgWceNjvBYJvCeblW1KDQUWypl-cBH3KoaFsWgQHFfJ_joG8kvXAcwvqyFdUgWhzx8H7WMWb1DS4oj3YcjsOMSs62zIQ-eEoH-VGIIID_TCt08Md1MMyK_hVlquxg1umQDDOYBImQmB-dOTFaQ-i-o31JSxuNF2JkA5ptV-JwikY1at2ytWwaGVy2FrDFrWzhJK04DeotK2I',
];

const ROW_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBEWj4Xkxy-jpVKZvmjy25L0QzRk0MX2aMmyQV2Zqj2tAqYYPK10824Rk7BdIE5YYg9-pFO8sNE08azh-P1dWFxyJghsXRkF6YP-QBs4RVE2gPg6AUMsgQ1nQSQ-UEwWLWx2i2kia0oE-yXO8l1BaVeF7bSdNvpAZlCyiHi1g6A0o-KalEYJqDLHLdn33Iv5kdg6-loeTfpGpx-YwC_OOtVKlnML_Q86rm3gi2uRQ-ukARbMdwIFUeWJ07F_w1UPXh19Pdvn67q7y9D',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAXOFtcKL6mnhdlQpR0O63-SGcpJjrqrhg5TV0lZPtIniaWurikxznxAB6OIDk0jpuvR0vCWkBa1S4mvJeURnyLGPdouz0PzvLjEFeNHgp5b3aSYHc5xuxzUJ-POXF2WguLbe36qGgFMZXmVYIPvTJnfJNt3cc-6_zA0nXw1jZbPlaHQXPccLLOhxMmqLg6N73hMKU0YaFRGAKKAQMHYyWC-fnyCxdHUCkny6iZb-5e1TVCvJaq93jS1ZFAe6Z_bWipm_9YhQ0Y6loF',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC8U_3OdlIASMlP8O87afLtd5V48yoHsgF_YAXXYGhrcNVxranOs2FSh98_Eb7PfLsogQVwToC1nxi-9IZ3u9m1KH1Gpk7id21l8mTco-F_a2FZTGw9kE_FzaUOw_M71MtC2_zb2s5MDFggXU6kbtesrvjVKoNRfqP5sja7p8HmJ-aDRyI8lHgHbEigSDC18QXYseiv52slIcMq7ESsuSrxzjKfYgQgJ-W1R1nCitFx6jy4lSZGtKFTgvw-cPZY2FS3vt_cWs_nNKZp',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAGdEJTlD1CQcm9sxMZZO-r3A9NoJsFe0WMwL8oupdh66JXIbNgcJAM488zSjpI-Xo5mp_Y2ajW16ab5jgG9NkgVBWrOrSKBT0yT0hlNsfG7thWzP9a3BSGegXefueC3cihibV2CcY6f6VOYx8OH5dNPymzfaTcnAdQ73wyDcEOeXsTo_QarMEjr7Rnf56SHFTnXFj72vXUKei1AoEwjLGXm074PlsQMsQG9zGohR9VJrRvsAVxXMHRvHhoHtJMbHoDQJfMqrx1pezw',
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

  const podium = useMemo(() => {
    if (entries.length >= 3) {
      const topThree = entries.slice(0, 3);
      return [topThree[1], topThree[0], topThree[2]].map((entry, index) => ({
        rank: entry.rank || [2, 1, 3][index],
        name: entry.name,
        totalDistance: Number(entry.totalDistance || 0),
        totalRuns: Number(entry.totalRuns || 0),
      }));
    }

    return [];
  }, [entries]);

  const rows = useMemo(() => {
    if (entries.length > 3) {
      return entries.slice(3, 7).map((entry: any, index: number) => ({
        rank: entry.rank || index + 4,
        name: entry.name,
        totalDistance: Number(entry.totalDistance || 0),
        totalRuns: Number(entry.totalRuns || 0),
        tier: entry.you ? 'RISING STAR' : index === 0 ? 'MASTER CLASS' : 'PRO LEAGUE',
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
          <Text style={styles.subtitle}>GLOBAL STANDING / CYCLE 24</Text>
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
          <>
            <View style={styles.podium}>
              {podium.map((item: any, index: number) => {
            const isWinner = Number(item.rank) === 1;
            const image = PODIUM_IMAGES[index];

            return (
              <View key={`${item.rank}-${item.name}`} style={styles.podiumItem}>
                <View style={[styles.podiumGlow, isWinner && styles.winnerGlow]} />
                <View
                  style={[
                    styles.podiumAvatarWrap,
                    isWinner && styles.winnerAvatarWrap,
                    index === 0 && styles.silverRing,
                    index === 2 && styles.bronzeRing,
                  ]}>
                  <Image source={{uri: image}} style={styles.podiumAvatar} />
                </View>
                <View style={[styles.rankBadge, isWinner && styles.winnerBadge]}>
                  {isWinner ? (
                    <Ionicons name="ribbon" size={18} color={Colors.onPrimaryFixed} />
                  ) : (
                    <Text style={styles.rankBadgeText}>{item.rank}</Text>
                  )}
                </View>
                <Text
                  numberOfLines={isWinner ? 2 : 1}
                  style={[styles.podiumName, isWinner && styles.winnerName]}>
                  {String(item.name).toUpperCase()}
                </Text>
                <Text style={[styles.podiumDistance, isWinner && styles.winnerDistance]}>
                  {Number(item.totalDistance || 0).toFixed(1)}
                </Text>
                <Text style={styles.podiumUnit}>KM</Text>
              </View>
            );
              })}
            </View>

            <View style={styles.rows}>
              {rows.map((entry: any, index: number) => (
            <View
              key={`${entry.rank}-${entry.name}`}
              style={[styles.row, entry.you && styles.youRow]}>
              {entry.you ? <View style={styles.rowGlow} /> : null}
              <Text style={[styles.rowRank, entry.you && styles.youText]}>
                {String(entry.rank).padStart(2, '0')}
              </Text>
              <Image source={{uri: ROW_IMAGES[index]}} style={styles.rowAvatar} />
              <View style={styles.rowIdentity}>
                <View style={styles.nameLine}>
                  <Text numberOfLines={2} style={styles.rowName}>
                    {String(entry.name).toUpperCase()}
                  </Text>
                  {entry.you ? <Text style={styles.youBadge}>YOU</Text> : null}
                </View>
                <Text style={[styles.rowTier, entry.you && styles.youText]}>
                  {entry.tier}
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
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 54,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
  },
  podiumGlow: {
    position: 'absolute',
    top: 16,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: Colors.tertiary + '16',
    shadowColor: Colors.tertiary,
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  winnerGlow: {
    top: -8,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary + '18',
    shadowColor: Colors.primary,
  },
  podiumAvatarWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 4,
    backgroundColor: Colors.tertiary,
  },
  winnerAvatarWrap: {
    width: 126,
    height: 126,
    borderRadius: 63,
    padding: 5,
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: Colors.secondary,
  },
  silverRing: {
    backgroundColor: '#9AA4B2',
  },
  bronzeRing: {
    backgroundColor: Colors.tertiary,
  },
  podiumAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  rankBadge: {
    marginTop: -22,
    marginLeft: 54,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: Colors.outline,
  },
  winnerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginLeft: 82,
    backgroundColor: Colors.primary,
    borderColor: Colors.surface,
  },
  rankBadgeText: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 14,
    fontWeight: '900',
  },
  podiumName: {
    marginTop: 20,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  winnerName: {
    color: Colors.primary,
    fontSize: 18,
    letterSpacing: 4,
  },
  podiumDistance: {
    marginTop: 12,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  winnerDistance: {
    fontSize: 36,
  },
  podiumUnit: {
    marginTop: 2,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 11,
    fontWeight: '900',
    fontStyle: 'italic',
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
  rowAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
