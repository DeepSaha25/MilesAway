import ApiClient from './apiClient';

const UserService = {
  async getProfile() {
    return ApiClient.get('/user/profile');
  },

  async getMe() {
    return ApiClient.get('/user/me');
  },

  async updateLocation(latitude: number, longitude: number) {
    return ApiClient.put('/user/location', { latitude, longitude });
  },

  async getStats() {
    return ApiClient.get('/user/stats');
  },

  async deleteAccount(currentPassword: string) {
    return ApiClient.deleteWithBody('/user/account', {currentPassword});
  },
};

export default UserService;
