import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
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
import CommunityService from '../services/communityService';
import {Colors} from '../theme/colors';

const ROUTE_IMAGE = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAne9FKW939tNGLQIod-ppt6YfhXA64N3e4-ywP120nmGABnmeaU6BZO4uJMgnVms_Ogwpb0ItZ_pwOuyZ3z0WJWFnBAbt-w4ri8vnEn1K4lhw86jaJ24N-kCHL3zyCee7S_A6fpWygxHfOAoQYdOj-wyKjRJ7MJZhPrPWdEkK7eGClw3suyKlVZZhK4XnNGtQrqpjf93_ZUNz6Hf0u81jkA6Nka6qAXoE3QaJrGsHni4YQhZ93tu7P9be7xPqtNdxYhs6YG1y0b08M',
};

const RUN_SCENE_IMAGE = {
  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_LKa2DyuoNiCfoO2E_AEmY89BnUJsCqzU964IYhNTkfw4zOfNy-hzU2gBQ4eU-IZi1URRc5pm3k5HOgYj6MYixnrnqWbF6_hoTNuMs76gWikiTbTZSgLNQj5hW9E0o6_YgXW4ZEew7eL4dURMDPSxXNthycGifRcC8dNTLcBYCdSdQv5k1oZf7F1-NH0VKAVdwtYKi2vnjHcJVAifPiguA_opK9CjnGygJJKOxWRk8FdIVDGZo8J_Q_Rf5q1IHaWuzc0rG6VI7rOA',
};

const AVATARS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBLPBkyrL1t7UNAi5Wkj9xozWUHrp13Dd5exN0sRQhKT7VMDrPfKywcooHtigjCdNqC6wPBKJVNlBdT9YzQOHsj9iVQM6bydsyOPz-703h8PlrHGP9GcnsWC1j-BIfcQgmS82EYGP6sxySp0BZl8xu2BEKqlq4aRwYP0xmVKJ_UAaQu1fDG_zPJhl6QnI5k2Twj_EM8Jylf_wwzlBekiMC99oIjdHmwna3zjnw_7tDOoCZWXl4Y4Z0nzwIWaEU5eAx_1_-gVI8ZpA2d',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAJCxU3dwDU-l5jTJMM3GufuaL6-Z378C5WnLV4ZVH2ATuPsWyzPEG--y_69KBhPGYM_OkX0hRD-MtQzhKMu7KFQOWnj7VgSjSONm9WMR0RmqsAZRtQQA0_aRYV0Cj7hbm7AL3yarUxUNWn1YekPdf9qiDMzx__YzYdwMh45_YdLxN4x6Tu0eoV6e8uEFx9e1_2u25JxD7di55xqQClNKrCvoSFptpuMJ0cAYVnN6TF77tcBRMc1bKqmDbQGdYFdq1mWNOGhHYo0lLh',
];

const CommunityFeedScreen = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      const res = await CommunityService.getFeed(1, 20);
      setPosts(res.posts || []);
      setError(null);
    } catch (loadError: any) {
      setPosts([]);
      setError(loadError?.message || 'Unable to load community feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const handleLike = async (postId?: string) => {
    if (!postId) {
      return;
    }

    try {
      await CommunityService.toggleLike(postId);
      loadFeed();
    } catch {}
  };

  const feed = useMemo(() => posts.slice(0, 6), [posts]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) {
      return 'JUST NOW';
    }

    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) {
      return 'JUST NOW';
    }
    if (diffHrs < 24) {
      return `${diffHrs}H AGO`;
    }
    return `${Math.floor(diffHrs / 24)}D AGO`;
  };

  if (loading) {
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
          <Text style={styles.kicker}>GLOBAL NETWORK</Text>
          <Text style={styles.title}>COMMUNITY</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterActive} activeOpacity={0.8}>
              <Text style={styles.filterActiveText}>ALL ACTIVITY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterInactive} activeOpacity={0.8}>
              <Text style={styles.filterInactiveText}>FOLLOWING</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>COMMUNITY UNAVAILABLE</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : feed.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>NO ACTIVITY YET</Text>
            <Text style={styles.emptyText}>
              Shared GPS runs will appear here when your network posts.
            </Text>
          </View>
        ) : (
          feed.map((post, index) =>
            index % 2 === 0 ? (
              <View key={post._id || index} style={styles.routeCard}>
                <ImageBackground
                  source={post.image ? {uri: post.image} : ROUTE_IMAGE}
                  imageStyle={styles.routeImage}
                  style={styles.routeVisual}>
                  <View style={styles.routeOverlay} />
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>ACTIVE NOW</Text>
                  </View>
                </ImageBackground>
                <View style={styles.cardBody}>
                  <View style={styles.userRow}>
                    <View style={styles.userInfo}>
                      <Image
                        source={{uri: AVATARS[index % AVATARS.length]}}
                        style={styles.userAvatar}
                      />
                      <View style={styles.userCopy}>
                        <Text numberOfLines={1} style={styles.userName}>
                          {post.userId?.name || 'Runner'}
                        </Text>
                        <Text style={styles.userMeta}>
                          {formatDate(post.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.followButton} disabled>
                      <Text style={styles.followText}>FOLLOW</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.postText}>
                    {post.text || 'Shared a verified run.'}
                  </Text>

                  {post.runId ? (
                    <View style={styles.chipsRow}>
                      <View style={styles.dataChip}>
                        <Ionicons name="location" size={12} color={Colors.tertiary} />
                        <Text style={styles.dataChipValue}>
                          {Number(post.runId.distance || 0).toFixed(1)} KM
                        </Text>
                      </View>
                      <View style={styles.dataChip}>
                        <Ionicons name="speedometer" size={12} color={Colors.tertiary} />
                        <Text style={styles.dataChipValue}>
                          {post.runId.avgSpeed
                            ? (60 / post.runId.avgSpeed).toFixed(1)
                            : '--'}{' '}
                          /KM
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.engagementRow}>
                    <TouchableOpacity
                      style={styles.engageBtn}
                      onPress={() => handleLike(post._id)}>
                      <Ionicons name="heart" size={18} color={Colors.onSurfaceVariant} />
                      <Text style={styles.engageCount}>{post.likesCount || 0}</Text>
                    </TouchableOpacity>
                    <View style={styles.engageBtn}>
                      <Ionicons
                        name="chatbox"
                        size={17}
                        color={Colors.onSurfaceVariant}
                      />
                      <Text style={styles.engageCount}>
                        {post.commentsCount || 0}
                      </Text>
                    </View>
                    <Ionicons name="share-social" size={19} color={Colors.onSurfaceVariant} />
                  </View>
                </View>
              </View>
            ) : (
              <View key={post._id || index} style={styles.featureCard}>
                <View style={styles.featureHeader}>
                  <Image
                    source={{uri: AVATARS[index % AVATARS.length]}}
                    style={styles.featureAvatar}
                  />
                  <View style={styles.featureIdentity}>
                    <Text numberOfLines={1} style={styles.featureName}>
                      {post.userId?.name || 'Runner'}
                    </Text>
                    <Text style={styles.featureMeta}>{formatDate(post.createdAt)}</Text>
                  </View>
                </View>
                <ImageBackground
                  source={post.image ? {uri: post.image} : RUN_SCENE_IMAGE}
                  imageStyle={styles.sceneImage}
                  style={styles.scenePanel}>
                  <View style={styles.sceneOverlay} />
                  <Text style={styles.sceneValue}>
                    {post.runId?.duration
                      ? `${Math.round(post.runId.duration / 60)}:${String(
                          Math.round(post.runId.duration % 60),
                        ).padStart(2, '0')}`
                      : 'SYNCED'}
                  </Text>
                  <Text style={styles.sceneLabel}>OFFICIAL SPLIT</Text>
                </ImageBackground>

                <View style={styles.featureStats}>
                  <View style={styles.featureStat}>
                    <Text style={styles.featureStatLabel}>DISTANCE</Text>
                    <Text style={styles.featureStatValue}>
                      {post.runId?.distance
                        ? `${Number(post.runId.distance).toFixed(1)} KM`
                        : '--'}
                    </Text>
                  </View>
                  <View style={styles.featureStat}>
                    <Text style={styles.featureStatLabel}>PACE</Text>
                    <Text style={styles.featureStatValue}>
                      {post.runId?.avgSpeed
                        ? `${(60 / post.runId.avgSpeed).toFixed(1)} /KM`
                        : '--'}
                    </Text>
                  </View>
                </View>

                <View style={styles.featureActions}>
                  <TouchableOpacity style={styles.outlineAction}>
                    <Text style={styles.outlineActionText}>CELEBRATE</Text>
                  </TouchableOpacity>
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryContainer]}
                    style={styles.cheerAction}>
                    <Text style={styles.cheerActionText}>CHEER</Text>
                  </LinearGradient>
                </View>
              </View>
            ),
          )
        )}

        <View style={styles.sideCard}>
          <Text style={styles.sideTitle}>TRENDING CHALLENGES</Text>
          <View style={styles.challengeBlock}>
            <View style={styles.challengeTop}>
              <Text style={styles.challengeType}>NETWORK</Text>
              <Text style={styles.challengeCount}>{feed.length} POSTS</Text>
            </View>
            <Text style={styles.challengeName}>Community run stream</Text>
            <View style={styles.challengeTrack}>
              <View style={styles.challengeFill} />
            </View>
          </View>
          <TouchableOpacity style={styles.fullOutlineButton}>
            <Text style={styles.fullOutlineText}>VIEW ALL CHALLENGES</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sideCard}>
          <Text style={[styles.sideTitle, styles.clubTitle]}>KINETIC CLUBS</Text>
          <View style={styles.clubRow}>
            <View style={styles.clubIcon}>
              <Ionicons name="flash" size={20} color={Colors.secondary} />
            </View>
            <View>
              <Text style={styles.clubName}>LOCAL RUNNERS</Text>
              <Text style={styles.clubMeta}>NEARBY MEMBERS</Text>
            </View>
          </View>
          <View style={styles.clubRow}>
            <View style={styles.clubIcon}>
              <Ionicons name="snow" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.clubName}>PACE CREW</Text>
              <Text style={styles.clubMeta}>ACTIVE THIS WEEK</Text>
            </View>
          </View>
        </View>

        <View style={styles.proCard}>
          <Ionicons name="analytics" size={34} color={Colors.primary} />
          <Text style={styles.proTitle}>UPGRADE YOUR PERFORMANCE</Text>
          <Text style={styles.proCopy}>
            Unlock deeper route, stride, and recovery insights with RunSphere Pro.
          </Text>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            style={styles.proButton}>
            <Text style={styles.proButtonText}>GO PRO NOW</Text>
          </LinearGradient>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          style={styles.fabGradient}>
          <Ionicons name="add" size={30} color={Colors.onPrimaryFixed} />
        </LinearGradient>
      </TouchableOpacity>
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
    paddingTop: 26,
    paddingBottom: 24,
  },
  hero: {
    marginBottom: 28,
  },
  kicker: {
    color: Colors.primary + '99',
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  title: {
    marginTop: 8,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 16,
  },
  filterActive: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  filterInactive: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceContainerLow,
  },
  filterActiveText: {
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '800',
  },
  filterInactiveText: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyState: {
    borderRadius: 22,
    padding: 26,
    marginBottom: 22,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  emptyTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 22,
    fontStyle: 'italic',
  },
  emptyText: {
    marginTop: 8,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  routeCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 22,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  routeVisual: {
    height: 190,
    justifyContent: 'flex-end',
  },
  routeImage: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  routeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surfaceContainerHigh + '33',
  },
  activeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginLeft: 14,
    marginBottom: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.surface + 'CC',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  activeText: {
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  cardBody: {
    padding: 18,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  userCopy: {
    flex: 1,
  },
  userName: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 15,
    fontWeight: '900',
  },
  userMeta: {
    marginTop: 3,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  followButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  followText: {
    color: Colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    fontWeight: '900',
  },
  postText: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  dataChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: Colors.tertiaryContainer + '28',
  },
  dataChipValue: {
    color: Colors.tertiary,
    fontFamily: 'Lexend-Bold',
    fontSize: 12,
    fontWeight: '900',
  },
  engagementRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant + '22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  engageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engageCount: {
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '800',
  },
  featureCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  featureAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  featureIdentity: {
    flex: 1,
  },
  featureName: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 18,
    fontWeight: '900',
  },
  featureMeta: {
    marginTop: 4,
    color: Colors.secondary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  scenePanel: {
    height: 270,
    justifyContent: 'flex-end',
    padding: 22,
    marginBottom: 14,
    overflow: 'hidden',
  },
  sceneImage: {
    borderRadius: 18,
  },
  sceneOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surface + '22',
  },
  sceneValue: {
    color: Colors.white,
    fontFamily: 'Lexend-Black',
    fontSize: 34,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: '#000000',
    textShadowOffset: {width: 2, height: 3},
    textShadowRadius: 0,
  },
  sceneLabel: {
    color: Colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  featureStats: {
    gap: 10,
    marginBottom: 16,
  },
  featureStat: {
    minHeight: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
  },
  featureStatLabel: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  featureStatValue: {
    marginTop: 4,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  featureActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  outlineAction: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.onSurface,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  outlineActionText: {
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '900',
  },
  cheerAction: {
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  cheerActionText: {
    color: Colors.onPrimaryFixed,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '900',
  },
  sideCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    backgroundColor: Colors.surfaceContainerLow,
  },
  sideTitle: {
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    paddingLeft: 12,
    marginBottom: 20,
  },
  clubTitle: {
    borderLeftColor: Colors.secondary,
  },
  challengeBlock: {
    marginBottom: 22,
  },
  challengeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeType: {
    color: Colors.primary,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '900',
  },
  challengeCount: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  challengeName: {
    marginTop: 8,
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    fontWeight: '900',
  },
  challengeTrack: {
    marginTop: 12,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  challengeFill: {
    width: '65%',
    height: '100%',
    backgroundColor: Colors.primary,
  },
  fullOutlineButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '55',
    paddingVertical: 14,
  },
  fullOutlineText: {
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  clubIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
  },
  clubName: {
    color: Colors.onSurface,
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    fontWeight: '900',
  },
  clubMeta: {
    marginTop: 3,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '800',
  },
  proCard: {
    borderRadius: 22,
    padding: 26,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  proTitle: {
    marginTop: 18,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  proCopy: {
    marginTop: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  proButton: {
    marginTop: 22,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 15,
  },
  proButtonText: {
    color: Colors.onPrimaryFixed,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 82,
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSpace: {
    height: 116,
  },
});

export default CommunityFeedScreen;
