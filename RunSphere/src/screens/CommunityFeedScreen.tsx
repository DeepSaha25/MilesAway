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
import AppHeader from '../components/AppHeader';
import Avatar from '../components/Avatar';
import CommunitySkeleton from '../components/CommunitySkeleton';
import {useCommunityFeed} from '../hooks/useCommunityFeed';
import {Colors} from '../theme/colors';
import {formatDistance} from '../utils/runMetrics';

const CommunityFeedScreen = () => {
  const community = useCommunityFeed();

  if (community.loading && !community.refreshing) {
    return <CommunitySkeleton />;
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
            refreshing={community.refreshing}
            onRefresh={community.onRefresh}
            tintColor={Colors.primaryContainer}
          />
        }>
        <View style={styles.hero}>
          <Text style={styles.kicker}>GLOBAL NETWORK</Text>
          <Text style={styles.title}>COMMUNITY</Text>
        </View>

        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>LIVE RACE BOARD</Text>
              <Text style={styles.sectionTitle}>RUNNING EVENTS</Text>
            </View>
            <Ionicons name="radio" size={22} color={Colors.primaryContainer} />
          </View>

          {community.eventsError ? (
            <Text style={styles.eventsHint}>{community.eventsError}</Text>
          ) : community.liveEvents.length === 0 ? (
            <Text style={styles.eventsHint}>
              Add an events API key on the backend to stream nearby running
              event details.
            </Text>
          ) : (
            community.liveEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() =>
                  community.onOpenEventDetails(event.detailsUrl || event.url)
                }
                activeOpacity={0.84}>
                <ImageBackground
                  source={
                    event.image
                      ? {uri: event.image}
                      : require('../../assets/0d5b657d-389f-4324-9f54-467c22982015.png')
                  }
                  style={styles.eventImage}
                  imageStyle={styles.eventImageRadius}>
                  <View style={styles.eventOverlay} />
                  <View style={styles.eventTopRow}>
                    <View style={styles.eventBadge}>
                      <Ionicons name="flag" size={14} color={Colors.surface} />
                      <Text style={styles.eventBadgeText}>
                        {String(event.status || 'LIVE').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.eventDate}>
                      {community.formatEventDate(event.date)}
                    </Text>
                  </View>
                  <View style={styles.eventCopy}>
                    <Text numberOfLines={2} style={styles.eventTitle}>
                      {event.title}
                    </Text>
                    <View style={styles.eventLocationRow}>
                      <Ionicons
                        name="location"
                        size={14}
                        color={Colors.primaryContainer}
                      />
                      <Text numberOfLines={1} style={styles.eventMeta}>
                        {event.location || event.country || 'Location TBA'}
                      </Text>
                    </View>
                    <View style={styles.eventFooterRow}>
                      <View style={styles.eventSourceChip}>
                        <Text style={styles.eventSourceText}>
                          {event.source || 'EVENT INFO'}
                        </Text>
                      </View>
                      {event.detailsUrl || event.url ? (
                        <View style={styles.eventDetailsChip}>
                          <Text style={styles.eventDetailsText}>EVENT DETAILS</Text>
                          <Ionicons
                            name="open-outline"
                            size={13}
                            color={Colors.surface}
                          />
                        </View>
                      ) : null}
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))
          )}
        </View>

        {community.error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>COMMUNITY UNAVAILABLE</Text>
            <Text style={styles.emptyText}>{community.error}</Text>
          </View>
        ) : community.isGuest ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>SIGN IN TO JOIN</Text>
            <Text style={styles.emptyText}>
              Guest mode keeps runs local. Create an account to view and share
              community activity.
            </Text>
          </View>
        ) : community.feed.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>NO ACTIVITY YET</Text>
            <Text style={styles.emptyText}>
              Shared GPS runs will appear here when your network posts.
            </Text>
          </View>
        ) : (
          community.feed.map((post, index) =>
            index % 2 === 0 ? (
              <View key={post._id || index} style={styles.routeCard}>
                <View style={styles.cardBody}>
                  <View style={styles.userRow}>
                    <View style={styles.userInfo}>
                      <Avatar
                        uri={post.userId?.avatar}
                        name={post.userId?.name}
                        size={42}
                        borderColor={Colors.secondary}
                      />
                      <View style={styles.userCopy}>
                        <Text numberOfLines={1} style={styles.userName}>
                          {post.userId?.name || 'Runner'}
                        </Text>
                        <Text style={styles.userMeta}>
                          {community.formatDate(post.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.postText}>
                    {post.text || 'Shared a verified run.'}
                  </Text>

                  {post.runId ? (
                    <View style={styles.chipsRow}>
                      <View style={styles.dataChip}>
                        <Ionicons name="location" size={12} color={Colors.tertiary} />
                        <Text style={styles.dataChipValue}>
                          {formatDistance(Number(post.runId.distance || 0), true)} KM
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
                      onPress={() => community.onToggleLike(post._id)}>
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
                  <Avatar
                    uri={post.userId?.avatar}
                    name={post.userId?.name}
                    size={48}
                    borderColor={Colors.primary + '55'}
                  />
                  <View style={styles.featureIdentity}>
                    <Text numberOfLines={1} style={styles.featureName}>
                      {post.userId?.name || 'Runner'}
                    </Text>
                    <Text style={styles.featureMeta}>
                      {community.formatDate(post.createdAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.scenePanel}>
                  <Text style={styles.sceneValue}>
                    {post.runId?.duration
                      ? `${Math.round(post.runId.duration / 60)}:${String(
                          Math.round(post.runId.duration % 60),
                        ).padStart(2, '0')}`
                      : 'SYNCED'}
                  </Text>
                  <Text style={styles.sceneLabel}>OFFICIAL SPLIT</Text>
                </View>

                <View style={styles.featureStats}>
                  <View style={styles.featureStat}>
                    <Text style={styles.featureStatLabel}>DISTANCE</Text>
                    <Text style={styles.featureStatValue}>
                      {post.runId?.distance
                        ? `${formatDistance(Number(post.runId.distance), true)} KM`
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

                <View style={styles.engagementRow}>
                  <TouchableOpacity
                    style={styles.engageBtn}
                    onPress={() => community.onToggleLike(post._id)}>
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
                </View>
              </View>
            ),
          )
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
  eventsSection: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionKicker: {
    color: Colors.primary + '99',
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  sectionTitle: {
    marginTop: 4,
    color: Colors.onSurface,
    fontFamily: 'Lexend-Black',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  eventsHint: {
    color: Colors.onSurfaceVariant,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  eventCard: {
    height: 238,
    borderRadius: 20,
    marginTop: 10,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHighest,
  },
  eventImage: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  eventImageRadius: {
    borderRadius: 20,
  },
  eventOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 8, 13, 0.46)',
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eventBadge: {
    maxWidth: '58%',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryContainer,
  },
  eventBadgeText: {
    color: Colors.surface,
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  eventDate: {
    flex: 1,
    color: Colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'right',
    letterSpacing: 0.8,
  },
  eventCopy: {
    gap: 10,
  },
  eventTitle: {
    color: Colors.white,
    fontFamily: 'Lexend-Black',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: '#000000',
    textShadowOffset: {width: 1, height: 2},
    textShadowRadius: 0,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMeta: {
    flex: 1,
    color: Colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  eventFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eventSourceChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  eventSourceText: {
    color: Colors.white,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  eventDetailsChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryContainer,
  },
  eventDetailsText: {
    color: Colors.surface,
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
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
  footerSpace: {
    height: 116,
  },
});

export default CommunityFeedScreen;
