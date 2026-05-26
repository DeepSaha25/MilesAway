import ApiClient from './apiClient';

const CommunityService = {
  async getFeed(page = 1, limit = 20) {
    return ApiClient.get(`/community/feed?page=${page}&limit=${limit}`);
  },

  async getRunningEvents({
    countryCode = 'IN',
    keyword = 'running',
    limit = 10,
    latitude,
    longitude,
    radiusKm = 75,
  }: {
    countryCode?: string;
    keyword?: string;
    limit?: number;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
  } = {}) {
    const params = [
      ['countryCode', countryCode],
      ['keyword', keyword],
      ['limit', String(limit)],
      ['radiusKm', String(radiusKm)],
    ];

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      params.push(['latitude', String(latitude)]);
      params.push(['longitude', String(longitude)]);
    }

    const query = params
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return ApiClient.get(`/community/events?${query}`);
  },

  async createPost(text: string, runId?: string) {
    return ApiClient.post('/community/post', { text, runId });
  },

  async toggleLike(postId: string) {
    return ApiClient.post(`/community/post/${postId}/like`);
  },

  async addComment(postId: string, text: string) {
    return ApiClient.post(`/community/post/${postId}/comment`, { text });
  },
};

export default CommunityService;
