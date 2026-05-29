import {useCallback, useEffect, useMemo, useState} from 'react';
import {Linking} from 'react-native';
import CommunityService from '../services/communityService';
import {isGuestUser} from '../services/guestSession';
import {useAuthStore} from '../store/authStore';
import {getCurrentLocation, requestLocationPermission} from '../utils/location';

const COUNTRY_CODE_BY_NAME: Record<string, string> = {
  india: 'IN',
  'united states': 'US',
  usa: 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  canada: 'CA',
  australia: 'AU',
};

const getUserCountryCode = (country?: string | null) => {
  const normalized = String(country || '').trim();
  if (/^[a-z]{2}$/i.test(normalized)) {
    return normalized.toUpperCase();
  }

  return COUNTRY_CODE_BY_NAME[normalized.toLowerCase()] || 'IN';
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) {
    return 'JUST NOW';
  }

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  if (diffHrs < 1) {
    return 'JUST NOW';
  }
  if (diffHrs < 24) {
    return `${diffHrs}H AGO`;
  }
  return `${Math.floor(diffHrs / 24)}D AGO`;
};

const formatEventDate = (dateStr?: string) => {
  if (!dateStr) {
    return 'DATE TBA';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(new Date(dateStr))
    .toUpperCase();
};

export const useCommunityFeed = () => {
  const authUser = useAuthStore(state => state.user);
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const countryCode = getUserCountryCode(authUser?.location?.country);
      const hasPermission = await requestLocationPermission();
      const position = hasPermission
        ? await getCurrentLocation().catch(() => null)
        : null;
      const res = await CommunityService.getRunningEvents({
        countryCode,
        keyword: 'running',
        limit: 8,
        radiusKm: 75,
        latitude: position?.coords.latitude,
        longitude: position?.coords.longitude,
      });
      setEvents(res.events || []);
      setEventsError(null);
    } catch (loadError: any) {
      setEvents([]);
      setEventsError(loadError?.message || 'Unable to load running events.');
    }
  }, [authUser?.location?.country]);

  const loadFeed = useCallback(async () => {
    if (isGuestUser(authUser)) {
      setPosts([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

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
  }, [authUser]);

  const loadCommunity = useCallback(async () => {
    await Promise.all([loadEvents(), loadFeed()]);
    setLoading(false);
  }, [loadEvents, loadFeed]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadEvents(), loadFeed()]).finally(() => setRefreshing(false));
  }, [loadEvents, loadFeed]);

  const onToggleLike = useCallback(
    async (postId?: string) => {
      if (!postId) {
        return;
      }

      try {
        await CommunityService.toggleLike(postId);
        loadFeed();
      } catch {}
    },
    [loadFeed],
  );

  const onOpenEventDetails = useCallback(async (url?: string) => {
    if (!url) {
      return;
    }

    await Linking.openURL(url).catch(() => undefined);
  }, []);

  return {
    authUser,
    loading,
    refreshing,
    error,
    eventsError,
    feed: useMemo(() => posts.slice(0, 6), [posts]),
    liveEvents: useMemo(() => events.slice(0, 4), [events]),
    isGuest: isGuestUser(authUser),
    onRefresh,
    onToggleLike,
    onOpenEventDetails,
    formatDate,
    formatEventDate,
  };
};
