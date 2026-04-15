import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBetSlipStore } from '@/src/store/useStore';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius, formatOdds } from '@/src/constants/theme';
import { Fixture } from '@/src/types';

export default function LiveScreen() {
  const router = useRouter();
  const { addSelection, isInSlip } = useBetSlipStore();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [allFixtures, setAllFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'live' | 'upcoming'>('live');

  const loadData = async () => {
    try {
      const [live, upcoming] = await Promise.all([api.getLiveFixtures(), api.getFixtures({ status: 'upcoming' })]);
      setFixtures(live);
      setAllFixtures(upcoming);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const displayFixtures = tab === 'live' ? fixtures : allFixtures;

  const handleOddsTap = (fixture: Fixture, mi: number, si: number) => {
    const m = fixture.markets[mi]; const s = m.selections[si];
    addSelection({ fixture_id: fixture.id, fixture_name: `${fixture.home_team} vs ${fixture.away_team}`, market_name: m.name, selection_id: s.id, selection_name: s.name, odds: s.odds });
  };

  if (loading) return <View style={styles.loadingWrap}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Sports</Text>
        <TouchableOpacity testID="live-betslip-btn" onPress={() => router.push('/betslip')}>
          <Ionicons name="receipt-outline" size={22} color={Colors.textMain} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity testID="live-tab-live" style={[styles.tab, tab === 'live' && styles.tabActive]} onPress={() => setTab('live')}>
          <View style={styles.liveDot} />
          <Text style={[styles.tabText, tab === 'live' && styles.tabTextActive]}>Live ({fixtures.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="live-tab-upcoming" style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>Upcoming ({allFixtures.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />} contentContainerStyle={styles.list}>
        {displayFixtures.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name={tab === 'live' ? 'flash-off-outline' : 'time-outline'} size={48} color={Colors.textDim} />
            <Text style={styles.emptyText}>{tab === 'live' ? 'No live events right now' : 'No upcoming events'}</Text>
          </View>
        ) : displayFixtures.map((fixture) => (
          <TouchableOpacity key={fixture.id} testID={`live-fixture-${fixture.id}`} style={styles.fixtureCard} onPress={() => router.push(`/event/${fixture.id}`)}>
            <View style={styles.fixtureTop}>
              <Text style={styles.leagueName}>{fixture.league_name}</Text>
              {fixture.status === 'live' ? (
                <View style={styles.liveBadge}><View style={styles.pulse} /><Text style={styles.liveLabel}>LIVE {fixture.minute}'</Text></View>
              ) : (
                <Text style={styles.timeText}>{new Date(fixture.start_time).toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              )}
            </View>
            <View style={styles.teamsRow}>
              <Text style={styles.teamName}>{fixture.home_team}</Text>
              {fixture.status === 'live' ? (
                <View style={styles.scoreBox}><Text style={styles.score}>{fixture.score.home} - {fixture.score.away}</Text></View>
              ) : <Text style={styles.vs}>VS</Text>}
              <Text style={styles.teamName}>{fixture.away_team}</Text>
            </View>
            {fixture.markets.length > 0 && (
              <View style={styles.oddsRow}>
                {fixture.markets[0].selections.map((sel, si) => (
                  <TouchableOpacity key={sel.id} testID={`live-odds-${sel.id}`} style={[styles.oddsBtn, isInSlip(sel.id) && styles.oddsBtnActive]} onPress={() => handleOddsTap(fixture, 0, si)}>
                    <Text style={[styles.oddsLabel, isInSlip(sel.id) && styles.oddsLabelActive]}>{sel.label}</Text>
                    <Text style={[styles.oddsValue, isInSlip(sel.id) && styles.oddsValueActive]}>{formatOdds(sel.odds)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
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
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  tabActive: { backgroundColor: Colors.surfaceElevated },
  tabText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textDim },
  tabTextActive: { color: Colors.textMain },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accentLive },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { fontSize: FontSizes.md, color: Colors.textDim },
  fixtureCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  fixtureTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  leagueName: { fontSize: FontSizes.xs, color: Colors.textDim, fontWeight: '600', textTransform: 'uppercase' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accentLive },
  liveLabel: { fontSize: FontSizes.xs, color: Colors.accentLive, fontWeight: '800' },
  timeText: { fontSize: FontSizes.xs, color: Colors.textDim },
  teamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  teamName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMain, flex: 1, textAlign: 'center' },
  vs: { fontSize: FontSizes.sm, color: Colors.textDim, fontWeight: '600', marginHorizontal: Spacing.md },
  scoreBox: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.sm },
  score: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.textMain },
  oddsRow: { flexDirection: 'row', gap: Spacing.sm },
  oddsBtn: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.md, height: 44, borderRadius: BorderRadius.md },
  oddsBtnActive: { backgroundColor: Colors.primary },
  oddsLabel: { fontSize: FontSizes.xs, color: Colors.textDim, fontWeight: '600' },
  oddsLabelActive: { color: Colors.primaryForeground },
  oddsValue: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.textMain },
  oddsValueActive: { color: Colors.primaryForeground },
});
