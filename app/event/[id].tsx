import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBetSlipStore } from '@/src/store/useStore';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius, formatOdds } from '@/src/constants/theme';
import { Fixture } from '@/src/types';

export default function EventDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addSelection, isInSlip, selections } = useBetSlipStore();
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) api.getFixture(id).then(setFixture).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleOddsTap = (mi: number, si: number) => {
    if (!fixture) return;
    const m = fixture.markets[mi]; const s = m.selections[si];
    addSelection({ fixture_id: fixture.id, fixture_name: `${fixture.home_team} vs ${fixture.away_team}`, market_name: m.name, selection_id: s.id, selection_name: s.name, odds: s.odds });
  };

  if (loading) return <View style={styles.loadingWrap}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!fixture) return <View style={styles.loadingWrap}><Text style={styles.errorText}>Event not found</Text></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="event-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{fixture.league_name}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Match Header */}
        <View style={styles.matchCard}>
          {fixture.status === 'live' && (
            <View style={styles.liveBadge}><View style={styles.pulse} /><Text style={styles.liveText}>LIVE {fixture.minute}'</Text></View>
          )}
          <View style={styles.teamsRow}>
            <View style={styles.teamCol}>
              <View style={styles.teamBadge}><Text style={styles.teamInitial}>{fixture.home_team.charAt(0)}</Text></View>
              <Text style={styles.teamName}>{fixture.home_team}</Text>
            </View>
            <View style={styles.scoreCol}>
              {fixture.status === 'live' ? (
                <Text style={styles.score}>{fixture.score.home} - {fixture.score.away}</Text>
              ) : (
                <Text style={styles.vsText}>VS</Text>
              )}
              <Text style={styles.timeText}>
                {fixture.status === 'upcoming' ? new Date(fixture.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
              </Text>
            </View>
            <View style={styles.teamCol}>
              <View style={styles.teamBadge}><Text style={styles.teamInitial}>{fixture.away_team.charAt(0)}</Text></View>
              <Text style={styles.teamName}>{fixture.away_team}</Text>
            </View>
          </View>
        </View>

        {/* Markets */}
        <View style={styles.marketsSection}>
          <Text style={styles.marketsTitle}>Markets</Text>
          {fixture.markets.map((market, mi) => (
            <View key={market.id} style={styles.marketCard}>
              <Text style={styles.marketName}>{market.name}</Text>
              <View style={styles.selectionsGrid}>
                {market.selections.map((sel, si) => (
                  <TouchableOpacity
                    key={sel.id}
                    testID={`event-odds-${sel.id}`}
                    style={[styles.oddsBtn, isInSlip(sel.id) && styles.oddsBtnActive]}
                    onPress={() => handleOddsTap(mi, si)}
                  >
                    <Text style={[styles.oddsLabel, isInSlip(sel.id) && styles.oddsLabelActive]}>{sel.name}</Text>
                    <Text style={[styles.oddsValue, isInSlip(sel.id) && styles.oddsValueActive]}>{formatOdds(sel.odds)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bet Slip Floating Button */}
      {selections.length > 0 && (
        <TouchableOpacity testID="event-betslip-fab" style={styles.fab} onPress={() => router.push('/betslip')}>
          <Ionicons name="receipt" size={20} color={Colors.primaryForeground} />
          <Text style={styles.fabText}>Bet Slip ({selections.length})</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.textMuted, fontSize: FontSizes.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  matchCard: { marginHorizontal: Spacing.lg, padding: Spacing.xl, backgroundColor: Colors.surface, borderRadius: BorderRadius.xxl, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: Spacing.md },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accentLive },
  liveText: { fontSize: FontSizes.sm, color: Colors.accentLive, fontWeight: '800' },
  teamsRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  teamCol: { flex: 1, alignItems: 'center' },
  teamBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  teamInitial: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.primary },
  teamName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMain, textAlign: 'center' },
  scoreCol: { alignItems: 'center', paddingHorizontal: Spacing.lg },
  score: { fontSize: 32, fontWeight: '900', color: Colors.textMain },
  vsText: { fontSize: FontSizes.xl, color: Colors.textDim, fontWeight: '700' },
  timeText: { fontSize: FontSizes.xs, color: Colors.textDim, marginTop: 4, textAlign: 'center' },
  marketsSection: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl, paddingBottom: 100 },
  marketsTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.textMain, marginBottom: Spacing.md },
  marketCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  marketName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMuted, marginBottom: Spacing.md },
  selectionsGrid: { gap: Spacing.sm },
  oddsBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.lg, height: 48, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'transparent' },
  oddsBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  oddsLabel: { fontSize: FontSizes.md, color: Colors.textMain, fontWeight: '500' },
  oddsLabelActive: { color: Colors.primaryForeground },
  oddsValue: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.primary },
  oddsValueActive: { color: Colors.primaryForeground },
  fab: { position: 'absolute', bottom: 24, left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, height: 56, borderRadius: BorderRadius.lg },
  fabText: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.primaryForeground },
});
