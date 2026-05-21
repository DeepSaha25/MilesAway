import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Colors } from '../theme/colors';
import AppHeader from '../components/AppHeader';
import CommunityService from '../services/communityService';

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

  const handleLike = async (postId: string) => {
    try {
      await CommunityService.toggleLike(postId);
      loadFeed();
    } catch {}
  };

  const formatDate = (dateStr: string) => {
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
        }
      >
        <Text style={styles.kicker}>Community</Text>
        <Text style={styles.title}>COMMUNITY</Text>

        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterActive}>
            <Text style={styles.filterActiveText}>ALL ACTIVITY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterInactive} disabled>
            <Text style={styles.filterInactiveText}>FOLLOWING</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Community unavailable</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>
              Verified run posts will appear here when your community starts
              sharing.
            </Text>
          </View>
        ) : (
          posts.map((post, index) => (
            <View key={post._id || index} style={styles.feedCard}>
              <View style={styles.visualPanel}>
                <Image
                  source={{
                    uri:
                      post.image ||
                      'https://images.unsplash.com/photo-1502904550040-7534597429ae?q=80&w=1200&auto=format&fit=crop',
                  }}
                  style={styles.feedImage}
                />
                <View style={styles.imageOverlay} />
                <View style={styles.routeLine} />
                <View style={styles.routeDot} />
                <Text style={styles.visualBadge}>ACTIVE NOW</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.userRow}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userInitial}>
                        {(post.userId?.name?.[0] || '?').toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.userName}>
                        {post.userId?.name || 'Unknown Runner'}
                      </Text>
                      <Text style={styles.userMeta}>
                        {formatDate(post.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.followButton} disabled>
                    <Text style={styles.followText}>SOON</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.postText}>{post.text}</Text>

                {post.runId ? (
                  <View style={styles.chipsRow}>
                    <View style={styles.dataChip}>
                      <Text style={styles.dataChipLabel}>DIST</Text>
                      <Text style={styles.dataChipValue}>
                        {post.runId.distance?.toFixed(1)} KM
                      </Text>
                    </View>
                    <View style={styles.dataChip}>
                      <Text style={styles.dataChipLabel}>PACE</Text>
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
                    onPress={() => handleLike(post._id)}
                  >
                    <Text style={styles.engageLabel}>LIKE</Text>
                    <Text style={styles.engageCount}>
                      {post.likesCount || 0}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.engageBtn}>
                    <Text style={styles.engageLabel}>COMMENTS</Text>
                    <Text style={styles.engageCount}>
                      {post.commentsCount || 0}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cheerButton} disabled>
                    <Text style={styles.cheerText}>CHEER</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  kicker: {
    color: Colors.primary + '99',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    marginBottom: 18,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Bold',
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  filterActive: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
  },
  filterInactive: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
  },
  filterActiveText: {
    color: Colors.onSurface,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  filterInactiveText: {
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24,
  },
  emptyTitle: {
    color: Colors.onSurface,
    fontSize: 20,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 8,
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 28,
  },
  feedCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 18,
  },
  visualPanel: {
    height: 180,
    backgroundColor: Colors.surfaceContainerLow,
    overflow: 'hidden',
  },
  feedImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surfaceContainerHigh + '55',
  },
  routeLine: {
    position: 'absolute',
    left: 28,
    right: 34,
    top: 92,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    transform: [{ rotate: '-10deg' }],
  },
  routeDot: {
    position: 'absolute',
    right: 32,
    top: 72,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: Colors.secondary,
  },
  visualBadge: {
    position: 'absolute',
    left: 16,
    bottom: 14,
    color: Colors.onSurface,
    backgroundColor: Colors.surface + 'CC',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    overflow: 'hidden',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 18,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: {
    color: Colors.onSecondaryFixed,
    fontSize: 18,
    fontWeight: '900',
  },
  userName: {
    color: Colors.onSurface,
    fontSize: 16,
    fontWeight: '800',
  },
  userMeta: {
    marginTop: 4,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
  },
  followButton: {
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '55',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  followText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  postText: {
    color: Colors.onSurface,
    fontSize: 14,
    lineHeight: 22,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  dataChip: {
    flex: 1,
    backgroundColor: Colors.tertiaryContainer + '20',
    borderRadius: 18,
    padding: 14,
  },
  dataChipLabel: {
    color: Colors.tertiary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  dataChipValue: {
    marginTop: 8,
    color: Colors.tertiary,
    fontSize: 16,
    fontWeight: '800',
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant + '22',
  },
  engageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engageLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  engageCount: {
    color: Colors.onSurface,
    fontSize: 12,
    fontWeight: '800',
  },
  cheerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cheerText: {
    color: Colors.onPrimaryFixed,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  footerSpace: {
    height: 120,
  },
});

export default CommunityFeedScreen;
