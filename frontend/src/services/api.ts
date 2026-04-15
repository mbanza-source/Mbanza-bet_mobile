import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

class ApiService {
  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/mobile${endpoint}`, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Network error' }));
      const msg = typeof error.detail === 'string' ? error.detail :
        Array.isArray(error.detail) ? error.detail.map((e: any) => e.msg || JSON.stringify(e)).join('. ') :
        'Something went wrong';
      throw new Error(msg);
    }

    return response.json();
  }

  // Auth
  async register(data: { email: string; phone?: string; username?: string; name: string; password: string }) {
    return this.request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  async login(data: { identifier: string; password: string }) {
    return this.request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async updateProfile(data: { name?: string; phone?: string; username?: string }) {
    return this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  }

  // Wallet
  async getWalletBalance() {
    return this.request('/wallet/balance');
  }

  async getTransactions(type?: string) {
    const params = type && type !== 'all' ? `?type=${type}` : '';
    return this.request(`/wallet/transactions${params}`);
  }

  async initiateDeposit(data: { amount: number; method: string }) {
    return this.request('/wallet/deposit', { method: 'POST', body: JSON.stringify(data) });
  }

  async requestWithdrawal(data: { amount: number; method: string; account_details?: string }) {
    return this.request('/wallet/withdraw', { method: 'POST', body: JSON.stringify(data) });
  }

  // Sports
  async getSports() {
    return this.request('/sports');
  }

  async getLeagues(sportId: string) {
    return this.request(`/sports/${sportId}/leagues`);
  }

  async getFixtures(params?: { sport_id?: string; league_id?: string; status?: string }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request(`/sports/fixtures${query}`);
  }

  async getFixture(id: string) {
    return this.request(`/sports/fixtures/${id}`);
  }

  async getLiveFixtures() {
    return this.request('/sports/live');
  }

  async getFeaturedFixtures() {
    return this.request('/sports/featured');
  }

  // Betting
  async placeBet(data: { selections: any[]; stake: number; bet_type: string }) {
    return this.request('/bets/place', { method: 'POST', body: JSON.stringify(data) });
  }

  async getOpenBets() {
    return this.request('/bets/open');
  }

  async getSettledBets() {
    return this.request('/bets/settled');
  }

  async getBetDetails(id: string) {
    return this.request(`/bets/${id}`);
  }

  // KYC
  async uploadKYC(data: { document_type: string; file_data: string }) {
    return this.request('/kyc/upload', { method: 'POST', body: JSON.stringify(data) });
  }

  async getKYCStatus() {
    return this.request('/kyc/status');
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  // Promotions
  async getPromotions() {
    return this.request('/promotions');
  }
}

export const api = new ApiService();
