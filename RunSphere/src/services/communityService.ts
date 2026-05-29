import ApiClient from './apiClient';
import {buildQuery} from '../utils/url';

const CommunityService = {
  async getFeed(page = 1, limit = 20) {
    const query = buildQuery({page, limit});
    return ApiClient.get(`/community/feed${query}`);
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
    const query = buildQuery({
      countryCode,
      keyword,
      limit,
      radiusKm,
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
    });
    return ApiClient.get(`/community/events${query}`);
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
