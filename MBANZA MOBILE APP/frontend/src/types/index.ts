export interface User {
  id: string;
  email: string;
  phone?: string;
  username?: string;
  name: string;
  role: string;
  kyc_status: string;
  currency: string;
  created_at?: string;
}

export interface Wallet {
  balance: number;
  available_balance: number;
  bonus_balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'stake' | 'winning' | 'refund' | 'bonus';
  amount: number;
  balance_after: number;
  status: string;
  reference: string;
  description: string;
  created_at: string;
  method?: string;
}

export interface Sport {
  id: string;
  name: string;
  icon: string;
  slug: string;
  type: 'team' | 'individual' | 'racing'; // team=Soccer/Rugby/Cricket, individual=Boxing/MMA, racing=Horse Racing (future)
  active: boolean;
  fixture_count?: number;
}

export interface Selection {
  id: string;
  name: string;
  label: string;
  odds: number;
}

export interface Market {
  id: string;
  name: string;
  type: string;
  selections: Selection[];
}

export interface Fixture {
  id: string;
  league_id: string;
  league_name: string;
  sport_id: string;
  sport_name: string;
  sport_type: 'team' | 'individual' | 'racing'; // team=league fixtures, individual=fight matchups, racing=horse racing (future)
  home_team: string;
  away_team: string;
  start_time: string;
  status: 'upcoming' | 'live' | 'finished';
  score: { home: number; away: number };
  minute?: number;
  markets: Market[];
  featured?: boolean;
}

export interface BetSelection {
  fixture_id: string;
  fixture_name: string;
  market_name: string;
  selection_id: string;
  selection_name: string;
  odds: number;
}

export interface Bet {
  id: string;
  selections: BetSelection[];
  bet_type: string;
  total_odds: number;
  stake: number;
  potential_return: number;
  status: 'open' | 'won' | 'lost' | 'void';
  winnings: number;
  placed_at: string;
  settled_at?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: string;
  terms: string;
  active: boolean;
  start_date: string;
  end_date: string;
}

export interface KYCDocument {
  id: string;
  document_type: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
}
