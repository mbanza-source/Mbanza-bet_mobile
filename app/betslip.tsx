import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBetSlipStore, useWalletStore } from '@/src/store/useStore';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius, formatCurrency, formatOdds } from '@/src/constants/theme';

export default function BetSlip() {
  const router = useRouter();
  const { selections, removeSelection, clearSelections, getTotalOdds } = useBetSlipStore();
  const { wallet, setWallet } = useWalletStore();
  const [stake, setStake] = useState('');
  const [loading, setLoading] = useState(false);

  const totalOdds = getTotalOdds();
  const stakeNum = parseFloat(stake) || 0;
  const potentialReturn = stakeNum * totalOdds;
  const betType = selections.length === 1 ? 'single' : 'accumulator';

  const handlePlaceBet = async () => {
    if (stakeNum < 5) { Alert.alert('Error', 'Minimum stake is NAD 5'); return; }
    if (stakeNum > (wallet?.available_balance || 0)) { Alert.alert('Error', 'Insufficient balance'); return; }
    if (selections.length === 0) { Alert.alert('Error', 'Add selections to your bet slip'); return; }

    setLoading(true);
    try {
      const res = await api.placeBet({
        selections: selections.map(s => ({ fixture_id: s.fixture_id, selection_id: s.selection_id })),
        stake: stakeNum,
        bet_type: betType,
      });
      setWallet({ ...wallet!, balance: res.wallet_balance, available_balance: res.wallet_balance });
      clearSelections();
      setStake('');
      Alert.alert('Bet Placed!', `Stake: ${formatCurrency(stakeNum)}\nPotential Return: ${formatCurrency(potentialReturn)}`, [
        { text: 'View Bets', onPress: () => router.replace('/(tabs)/bets') },
        { text: 'Continue Betting', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to place bet');
    } finally { setLoading(false); }
  };

  const quickStakes = [50, 100, 200, 500];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="betslip-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.title}>Bet Slip</Text>
        {selections.length > 0 && (
          <TouchableOpacity testID="betslip-clear-btn" onPress={clearSelections}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {selections.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color={Colors.textDim} />
            <Text style={styles.emptyTitle}>Bet Slip Empty</Text>
            <Text style={styles.emptyText}>Tap on odds to add selections</Text>
            <TouchableOpacity testID="betslip-browse-btn" style={styles.browseBtn} onPress={() => router.back()}>
              <Text style={styles.browseBtnText}>Browse Events</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{betType === 'single' ? 'Single Bet' : `Accumulator (${selections.length} selections)`}</Text>
            </View>

            {selections.map((sel) => (
              <View key={sel.selection_id} testID={`slip-selection-${sel.selection_id}`} style={styles.selCard}>
                <View style={styles.selInfo}>
                  <Text style={styles.selFixture}>{sel.fixture_name}</Text>
                  <Text style={styles.selMarket}>{sel.market_name}</Text>
                  <Text style={styles.selName}>{sel.selection_name}</Text>
                </View>
                <View style={styles.selRight}>
                  <Text style={styles.selOdds}>{formatOdds(sel.odds)}</Text>
                  <TouchableOpacity testID={`slip-remove-${sel.selection_id}`} onPress={() => removeSelection(sel.selection_id)}>
                    <Ionicons name="close-circle" size={22} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Stake Input */}
            <View style={styles.stakeSection}>
              <Text style={styles.stakeLabel}>Stake (NAD)</Text>
              <View style={styles.stakeInputWrap}>
                <Text style={styles.currencyPrefix}>NAD</Text>
                <TextInput
                  testID="betslip-stake-input"
                  style={styles.stakeInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textDim}
                  value={stake}
                  onChangeText={setStake}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.quickStakes}>
                {quickStakes.map((qs) => (
                  <TouchableOpacity key={qs} testID={`quick-stake-${qs}`} style={styles.quickStakeBtn} onPress={() => setStake(qs.toString())}>
                    <Text style={styles.quickStakeText}>{qs}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.balanceInfo}>Balance: {formatCurrency(wallet?.available_balance || 0)}</Text>
            </View>

            {/* Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Odds</Text>
                <Text style={styles.summaryValue}>{formatOdds(totalOdds)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Stake</Text>
                <Text style={styles.summaryValue}>{formatCurrency(stakeNum)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryHighlight]}>
                <Text style={styles.returnLabel}>Potential Return</Text>
                <Text style={styles.returnValue}>{formatCurrency(potentialReturn)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {selections.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity testID="betslip-place-btn" style={[styles.placeBtn, (stakeNum < 5 || loading) && styles.placeBtnDisabled]} onPress={handlePlaceBet} disabled={stakeNum < 5 || loading}>
            {loading ? <ActivityIndicator color={Colors.primaryForeground} /> : (
              <Text style={styles.placeBtnText}>Place Bet - {formatCurrency(stakeNum)}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  title: { flex: 1, fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.textMain },
  clearText: { fontSize: FontSizes.sm, color: Colors.error, fontWeight: '600' },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.textMain },
  emptyText: { fontSize: FontSizes.md, color: Colors.textDim },
  browseBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  browseBtnText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.primaryForeground },
  typeBadge: { backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
  typeText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase' },
  selCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  selInfo: { flex: 1 },
  selFixture: { fontSize: FontSizes.sm, color: Colors.textMuted },
  selMarket: { fontSize: FontSizes.xs, color: Colors.textDim, marginTop: 2 },
  selName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMain, marginTop: 4 },
  selRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  selOdds: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.primary },
  stakeSection: { marginTop: Spacing.lg },
  stakeLabel: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.sm },
  stakeInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.primary, height: 56, paddingHorizontal: Spacing.lg },
  currencyPrefix: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.primary, marginRight: Spacing.sm },
  stakeInput: { flex: 1, fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.textMain },
  quickStakes: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  quickStakeBtn: { flex: 1, height: 36, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  quickStakeText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textMain },
  balanceInfo: { fontSize: FontSizes.sm, color: Colors.textDim, marginTop: Spacing.sm },
  summary: { marginTop: Spacing.xl, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  summaryLabel: { fontSize: FontSizes.md, color: Colors.textMuted },
  summaryValue: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMain },
  summaryHighlight: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm, paddingTop: Spacing.md },
  returnLabel: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.primary },
  returnValue: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.primary },
  footer: { padding: Spacing.lg, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  placeBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  placeBtnDisabled: { opacity: 0.5 },
  placeBtnText: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.primaryForeground, textTransform: 'uppercase', letterSpacing: 1 },
});
