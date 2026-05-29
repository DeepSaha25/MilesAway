import ApiClient from './apiClient';
import {buildQuery} from '../utils/url';

export interface RunPayload {
  clientRunId: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  elapsedSeconds?: number;
  coordinates: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    altitude?: number | null;
    accuracy?: number | null;
    speed?: number | null;
    heading?: number | null;
  }>;
}

const RunService = {
  async submitRun(payload: RunPayload) {
    return ApiClient.post('/run/add', payload);
  },

  async getHistory(limit = 50, startDate?: string, endDate?: string) {
    const query = buildQuery({limit, startDate, endDate});
    return ApiClient.get(`/run/history${query}`);
  },

  async getStats() {
    return ApiClient.get('/run/stats');
  },

  async getWeeklyStats() {
    return ApiClient.get('/run/weekly-stats');
  },

  async getDailyStats(date?: string) {
    const query = buildQuery({date});
    return ApiClient.get(`/run/daily-stats${query}`);
  },
};

export default RunService;
