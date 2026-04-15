import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Wallet, BetSelection } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setHasSeenOnboarding: (val: boolean) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

interface WalletState {
  wallet: Wallet | null;
  setWallet: (wallet: Wallet | null) => void;
}

interface BetSlipState {
  selections: BetSelection[];
  addSelection: (selection: BetSelection) => void;
  removeSelection: (selectionId: string) => void;
  clearSelections: () => void;
  isInSlip: (selectionId: string) => boolean;
  getTotalOdds: () => number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  hasSeenOnboarding: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem('auth_token', token);
    } else {
      await AsyncStorage.removeItem('auth_token');
    }
    set({ token });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setHasSeenOnboarding: async (val) => {
    await AsyncStorage.setItem('has_seen_onboarding', val ? '1' : '0');
    set({ hasSeenOnboarding: val });
  },
  loadStoredAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const onboarding = await AsyncStorage.getItem('has_seen_onboarding');
      set({ token, hasSeenOnboarding: onboarding === '1' });
      if (token) {
        const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
        const res = await fetch(`${API_BASE}/api/mobile/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        }
      }
      set({ isAuthenticated: false, isLoading: false });
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  setWallet: (wallet) => set({ wallet }),
}));

export const useBetSlipStore = create<BetSlipState>((set, get) => ({
  selections: [],
  addSelection: (selection) => {
    const current = get().selections;
    const existing = current.findIndex(
      (s) => s.fixture_id === selection.fixture_id && s.market_name === selection.market_name
    );
    let updated: BetSelection[];
    if (existing >= 0) {
      if (current[existing].selection_id === selection.selection_id) {
        updated = current.filter((_, i) => i !== existing);
      } else {
        updated = [...current];
        updated[existing] = selection;
      }
    } else {
      updated = [...current, selection];
    }
    set({ selections: updated });
  },
  removeSelection: (selectionId) => {
    set({ selections: get().selections.filter((s) => s.selection_id !== selectionId) });
  },
  clearSelections: () => set({ selections: [] }),
  isInSlip: (selectionId) => get().selections.some((s) => s.selection_id === selectionId),
  getTotalOdds: () => {
    const sels = get().selections;
    if (sels.length === 0) return 0;
    return sels.reduce((acc, s) => acc * s.odds, 1);
  },
}));
