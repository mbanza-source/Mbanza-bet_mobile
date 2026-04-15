import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useWalletStore, useBetSlipStore } from '@/src/store/useStore';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius, formatCurrency, formatOdds } from '@/src/constants/theme';
import { Sport, Fixture } from '@/src/types';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { wallet, setWallet } = useWalletStore();
  const { addSelection, isInSlip, selections } = useBetSlipStore();
  const [sports, setSports] = useState<Sport[]>([]);
  const [featured, setFeatured] = useState<Fixture[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [walletData, sportsData, featuredData] = await Promise.all([
        api.getWalletBalance(),
        api.getSports(),
        api.getFeaturedFixtures(),
      ]);
      setWallet(walletData);
      setSports(sportsData);
      setFeatured(featuredData);
      if (sportsData.length > 0 && !activeSport) setActiveSport(sportsData[0].id);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOddsTap = (fixture: Fixture, marketIndex: number, selIndex: number) => {
    const market = fixture.markets[marketIndex];
    const sel = market.selections[selIndex];
    addSelection({
      fixture_id: fixture.id,
      fixture_name: `${fixture.home_team} vs ${fixture.away_team}`,
      market_name: market.name,
      selection_id: sel.id,
      selection_name: sel.name,
      odds: sel.odds,
    });
  };

  const sportIcons: Record<string, any> = {
    soccer: 'football', rugby: 'american-football', boxing: 'fitness', cricket: 'baseball', mma: 'body',
  };

  if (loading) {
    return <View style={styles.loadingWrap}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandText}>MBANZA BET</Text>
          <Text style={styles.welcomeText}>Hi, {user?.name?.split(' ')[0] || 'Player'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity testID="home-notifications-btn" style={styles.iconBtn} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textMain} />
          </TouchableOpacity>
          {selections.length > 0 && (
            <TouchableOpacity testID="home-betslip-btn" style={styles.slipBtn} onPress={() => router.push('/betslip')}>
              <Ionicons name="receipt" size={18} color={Colors.primaryForeground} />
              <Text style={styles.slipCount}>{selections.length}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletGlow} />
          <Text style={styles.walletLabel}>Available Balance</Text>
          <Text testID="home-wallet-balance" style={styles.walletBalance}>{formatCurrency(wallet?.balance || 0)}</Text>
          {(wallet?.bonus_balance || 0) > 0 && (
            <Text style={styles.bonusText}>Bonus: {formatCurrency(wallet?.bonus_balance || 0)}</Text>
          )}
          <View style={styles.walletActions}>
            <TouchableOpacity testID="home-deposit-btn" style={styles.depositBtn} onPress={() => router.push('/deposit')}>
              <Ionicons name="add-circle" size={18} color={Colors.primaryForeground} />
              <Text style={styles.depositBtnText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="home-withdraw-btn" style={styles.withdrawBtn} onPress={() => router.push('/withdraw')}>
              <Ionicons name="arrow-up-circle" size={18} color={Colors.primary} />
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="home-mybets-btn" style={styles.withdrawBtn} onPress={() => router.push('/(tabs)/bets')}>
              <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
              <Text style={styles.withdrawBtnText}>My Bets</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sports Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportsRow}>
          {sports.map((sport) => (
            <TouchableOpacity
              testID={`sport-${sport.slug}`}
              key={sport.id}
              style={[styles.sportChip, activeSport === sport.id && styles.sportChipActive]}
              onPress={() => setActiveSport(sport.id)}
            >
              <Ionicons name={sportIcons[sport.slug] || 'trophy'} size={18} color={activeSport === sport.id ? Colors.primaryForeground : Colors.textMuted} />
              <Text style={[styles.sportChipText, activeSport === sport.id && styles.sportChipTextActive]}>{sport.name}</Text>
              {(sport.fixture_count || 0) > 0 && <Text style={[styles.sportCount, activeSport === sport.id && styles.sportCountActive]}>{sport.fixture_count}</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Events</Text>
            <TouchableOpacity testID="home-see-all-btn" onPress={() => router.push('/(tabs)/live')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {featured.filter(f => !activeSport || f.sport_id === activeSport).slice(0, 6).map((fixture) => (
            <TouchableOpacity key={fixture.id} testID={`fixture-${fixture.id}`} style={styles.fixtureCard} onPress={() => router.push(`/event/${fixture.id}`)}>
              <View style={styles.fixtureHeader}>
                <View style={styles.leagueRow}>
                  <Text style={styles.leagueName}>{fixture.league_name}</Text>
                  {fixture.status === 'live' && (
                    <View style={styles.liveBadge}><View style={styles.livePulse} /><Text style={styles.liveText}>LIVE {fixture.minute}'</Text></View>
                  )}
                </View>
                <Text style={styles.fixtureTime}>
                  {fixture.status === 'upcoming' ? new Date(fixture.start_time).toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>

              <View style={styles.teamsRow}>
                <Text style={styles.teamName}>{fixture.home_team}</Text>
                {fixture.status === 'live' ? (
                  <View style={styles.scoreBox}>
                    <Text style={styles.scoreText}>{fixture.score.home} - {fixture.score.away}</Text>
                  </View>
                ) : (
                  <Text style={styles.vsText}>VS</Text>
                )}
                <Text style={styles.teamName}>{fixture.away_team}</Text>
              </View>

              {fixture.markets.length > 0 && (
                <View style={styles.oddsRow}>
                  {fixture.markets[0].selections.map((sel, si) => (
                    <TouchableOpacity
                      key={sel.id}
                      testID={`odds-${sel.id}`}
                      style={[styles.oddsBtn, isInSlip(sel.id) && styles.oddsBtnActive]}
                      onPress={() => handleOddsTap(fixture, 0, si)}
                    >
                      <Text style={[styles.oddsLabel, isInSlip(sel.id) && styles.oddsLabelActive]}>{sel.label}</Text>
                      <Text style={[styles.oddsValue, isInSlip(sel.id) && styles.oddsValueActive]}>{formatOdds(sel.odds)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Promotions */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <TouchableOpacity testID="home-promos-btn" style={styles.promoCard} onPress={() => router.push('/promotions')}>
            <Ionicons name="gift" size={28} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle}>Welcome Bonus</Text>
              <Text style={styles.promoDesc}>Get 100% match on your first deposit up to NAD 1,000</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textDim} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  brandText: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
  welcomeText: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  slipBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, height: 36, borderRadius: 18 },
  slipCount: { fontSize: FontSizes.sm, fontWeight: '800', color: Colors.primaryForeground },
  walletCard: { marginHorizontal: Spacing.lg, padding: Spacing.xl, backgroundColor: Colors.surface, borderRadius: BorderRadius.xxl, borderWidth: 1, borderColor: 'rgba(234,179,8,0.15)', overflow: 'hidden' },
  walletGlow: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(234,179,8,0.08)' },
  walletLabel: { fontSize: FontSizes.sm, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  walletBalance: { fontSize: 32, fontWeight: '900', color: Colors.textMain, marginTop: 4 },
  bonusText: { fontSize: FontSizes.sm, color: Colors.primary, marginTop: 4 },
  walletActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  depositBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, height: 40, borderRadius: BorderRadius.md },
  depositBtnText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.primaryForeground },
  withdrawBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.lg, height: 40, borderRadius: BorderRadius.md },
  withdrawBtnText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.primary },
  sportsRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, gap: Spacing.sm },
  sportChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, height: 40, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  sportChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sportChipText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textMuted },
  sportChipTextActive: { color: Colors.primaryForeground },
  sportCount: { fontSize: FontSizes.xs, color: Colors.textDim, fontWeight: '700', backgroundColor: Colors.surfaceElevated, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  sportCountActive: { backgroundColor: 'rgba(0,0,0,0.2)', color: Colors.primaryForeground },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.textMain },
  seeAll: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: '600' },
  fixtureCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  fixtureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  leagueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  leagueName: { fontSize: FontSizes.xs, color: Colors.textDim, fontWeight: '600', textTransform: 'uppercase' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accentLive },
  liveText: { fontSize: FontSizes.xs, color: Colors.accentLive, fontWeight: '800' },
  fixtureTime: { fontSize: FontSizes.xs, color: Colors.textDim },
  teamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  teamName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMain, flex: 1, textAlign: 'center' },
  vsText: { fontSize: FontSizes.sm, color: Colors.textDim, fontWeight: '600', marginHorizontal: Spacing.md },
  scoreBox: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.sm },
  scoreText: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.textMain },
  oddsRow: { flexDirection: 'row', gap: Spacing.sm },
  oddsBtn: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.md, height: 44, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'transparent' },
  oddsBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  oddsLabel: { fontSize: FontSizes.xs, color: Colors.textDim, fontWeight: '600' },
  oddsLabelActive: { color: Colors.primaryForeground },
  oddsValue: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.textMain },
  oddsValueActive: { color: Colors.primaryForeground },
  promoCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'rgba(234,179,8,0.15)' },
  promoTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.primary },
  promoDesc: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
});
