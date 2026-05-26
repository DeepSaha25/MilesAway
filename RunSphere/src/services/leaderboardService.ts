import ApiClient from './apiClient';

export type LeaderboardLevel = 'global' | 'city' | 'district' | 'state' | 'country';
export type TimePeriod = 'today' | 'weekly' | 'monthly';

const LeaderboardService = {
  async getLeaderboard(level: LeaderboardLevel, timePeriod: TimePeriod = 'weekly', limit = 100) {
    return ApiClient.get(`/leaderboard/${level}?timePeriod=${timePeriod}&limit=${limit}`);
  },

  async getGlobal(timePeriod: TimePeriod = 'weekly') {
    return this.getLeaderboard('global', timePeriod);
  },

  async getCity(timePeriod: TimePeriod = 'weekly') {
    return this.getLeaderboard('city', timePeriod);
  },

  async getDistrict(timePeriod: TimePeriod = 'weekly') {
    return this.getLeaderboard('district', timePeriod);
  },

  async getState(timePeriod: TimePeriod = 'weekly') {
    return this.getLeaderboard('state', timePeriod);
  },

  async getCountry(timePeriod: TimePeriod = 'weekly') {
    return this.getLeaderboard('country', timePeriod);
  },
};

export default LeaderboardService;
