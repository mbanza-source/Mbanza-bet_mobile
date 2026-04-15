import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius, formatCurrency, formatOdds } from '@/src/constants/theme';
import { Bet } from '@/src/types';

export default function BetsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'open' | 'settled'>('open');
  const [openBets, setOpenBets] = useState<Bet[]>([]);
  const [settledBets, setSettledBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [open, settled] = await Promise.all([api.getOpenBets(), api.getSettledBets()]);
      setOpenBets(open);
      setSettledBets(settled);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const bets = tab === 'open' ? openBets : settledBets;

  const statusColor = (status: string) => {
    switch (status) {
      case 'won': return Colors.success;
      case 'lost': return Colors.error;
      case 'void': return Colors.warning;
      default: return Colors.primary;
    }
  };

  if (loading) return <View style={styles.loadingWrap}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bets</Text>
        <TouchableOpacity testID="bets-betslip-btn" onPress={() => router.push('/betslip')}>
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity testID="bets-tab-open" style={[styles.tab, tab === 'open' && styles.tabActive]} onPress={() => setTab('open')}>
          <Text style={[styles.tabText, tab === 'open' && styles.tabTextActive]}>Open ({openBets.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="bets-tab-settled" style={[styles.tab, tab === 'settled' && styles.tabActive]} onPress={() => setTab('settled')}>
          <Text style={[styles.tabText, tab === 'settled' && styles.tabTextActive]}>Settled ({settledBets.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />} contentContainerStyle={styles.list}>
        {bets.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textDim} />
            <Text style={styles.emptyText}>No {tab} bets yet</Text>
            <TouchableOpacity testID="bets-browse-btn" style={styles.browseBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.browseBtnText}>Browse Events</Text>
            </TouchableOpacity>
          </View>
        ) : bets.map((bet) => (
          <View key={bet.id} testID={`bet-card-${bet.id}`} style={styles.betCard}>
            <View style={styles.betHeader}>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor(bet.status)}15` }]}>
                <Text style={[styles.statusText, { color: statusColor(bet.status) }]}>{bet.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.betType}>{bet.bet_type === 'single' ? 'Single' : `Accumulator (${bet.selections.length})`}</Text>
            </View>
            {bet.selections.map((sel, i) => (
              <View key={i} style={styles.selectionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selFixture}>{sel.fixture_name}</Text>
                  <Text style={styles.selDetail}>{sel.market_name}: <Text style={styles.selName}>{sel.selection_name}</Text></Text>
                </View>
                <Text style={styles.selOdds}>{formatOdds(sel.odds)}</Text>
              </View>
            ))}
            <View style={styles.betFooter}>
              <View>
                <Text style={styles.footLabel}>Stake</Text>
                <Text style={styles.footValue}>{formatCurrency(bet.stake)}</Text>
              </View>
              <View>
                <Text style={styles.footLabel}>Total Odds</Text>
                <Text style={styles.footValue}>{formatOdds(bet.total_odds)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.footLabel}>{bet.status === 'won' ? 'Won' : 'Potential Return'}</Text>
                <Text style={[styles.footValue, bet.status === 'won' && { color: Colors.success }]}>
                  {formatCurrency(bet.status === 'won' ? bet.winnings : bet.potential_return)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.textMain },
  tabs: { flexDirection: 'row', marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 4, marginBottom: Spacing.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  tabActive: { backgroundColor: Colors.surfaceElevated },
  tabText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textDim },
  tabTextActive: { color: Colors.textMain },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { fontSize: FontSizes.md, color: Colors.textDim },
  browseBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  browseBtnText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.primaryForeground },
  betCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  betHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSizes.xs, fontWeight: '800', textTransform: 'uppercase' },
  betType: { fontSize: FontSizes.xs, color: Colors.textDim, fontWeight: '600' },
  selectionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  selFixture: { fontSize: FontSizes.sm, color: Colors.textMuted },
  selDetail: { fontSize: FontSizes.sm, color: Colors.textDim, marginTop: 2 },
  selName: { color: Colors.textMain, fontWeight: '600' },
  selOdds: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.primary, marginLeft: Spacing.md },
  betFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  footLabel: { fontSize: FontSizes.xs, color: Colors.textDim },
  footValue: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMain, marginTop: 2 },
});
