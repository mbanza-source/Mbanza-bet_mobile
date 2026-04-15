import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/src/store/useStore';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius, formatCurrency } from '@/src/constants/theme';
import { Transaction } from '@/src/types';

export default function WalletScreen() {
  const router = useRouter();
  const { wallet, setWallet } = useWalletStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [w, txns] = await Promise.all([api.getWalletBalance(), api.getTransactions()]);
      setWallet(w);
      setTransactions(txns);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const txnIcon = (type: string) => {
    switch (type) {
      case 'deposit': return { icon: 'arrow-down-circle' as const, color: Colors.success };
      case 'withdrawal': return { icon: 'arrow-up-circle' as const, color: Colors.error };
      case 'stake': return { icon: 'football' as const, color: Colors.warning };
      case 'winning': return { icon: 'trophy' as const, color: Colors.success };
      case 'refund': return { icon: 'refresh-circle' as const, color: Colors.info };
      default: return { icon: 'swap-horizontal' as const, color: Colors.textMuted };
    }
  };

  if (loading) return <View style={styles.loadingWrap}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletGlow} />
          <Text style={styles.walletLabel}>Total Balance</Text>
          <Text testID="wallet-balance" style={styles.walletBalance}>{formatCurrency(wallet?.balance || 0)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balItemLabel}>Available</Text>
              <Text style={styles.balItemValue}>{formatCurrency(wallet?.available_balance || 0)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balItemLabel}>Bonus</Text>
              <Text style={styles.balItemValue}>{formatCurrency(wallet?.bonus_balance || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity testID="wallet-deposit-btn" style={styles.actionBtn} onPress={() => router.push('/deposit')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
              <Ionicons name="add-circle" size={24} color={Colors.success} />
            </View>
            <Text style={styles.actionText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="wallet-withdraw-btn" style={styles.actionBtn} onPress={() => router.push('/withdraw')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Ionicons name="arrow-up-circle" size={24} color={Colors.error} />
            </View>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="wallet-history-btn" style={styles.actionBtn} onPress={() => router.push('/transactions')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <Ionicons name="time" size={24} color={Colors.info} />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity testID="wallet-see-all-txns" onPress={() => router.push('/transactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyText}>No transactions yet</Text></View>
          ) : transactions.slice(0, 10).map((txn) => {
            const { icon, color } = txnIcon(txn.type);
            return (
              <View key={txn.id} testID={`txn-${txn.id}`} style={styles.txnRow}>
                <View style={[styles.txnIcon, { backgroundColor: `${color}15` }]}>
                  <Ionicons name={icon} size={20} color={color} />
                </View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnDesc}>{txn.description}</Text>
                  <Text style={styles.txnDate}>{new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.txnAmount}>
                  <Text style={[styles.txnAmountText, { color: txn.amount >= 0 ? Colors.success : Colors.error }]}>
                    {txn.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
                  </Text>
                  <View style={[styles.txnStatus, { backgroundColor: txn.status === 'completed' ? `${Colors.success}15` : `${Colors.warning}15` }]}>
                    <Text style={[styles.txnStatusText, { color: txn.status === 'completed' ? Colors.success : Colors.warning }]}>{txn.status}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.textMain },
  walletCard: { marginHorizontal: Spacing.lg, padding: Spacing.xl, backgroundColor: Colors.surface, borderRadius: BorderRadius.xxl, borderWidth: 1, borderColor: 'rgba(234,179,8,0.2)', overflow: 'hidden' },
  walletGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(234,179,8,0.06)' },
  walletLabel: { fontSize: FontSizes.sm, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  walletBalance: { fontSize: 36, fontWeight: '900', color: Colors.textMain, marginTop: 4 },
  balanceRow: { flexDirection: 'row', marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  balanceItem: { flex: 1 },
  balanceDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  balItemLabel: { fontSize: FontSizes.xs, color: Colors.textDim, fontWeight: '600', textTransform: 'uppercase' },
  balItemValue: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textMain, marginTop: 4 },
  actionRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginTop: Spacing.lg, gap: Spacing.sm },
  actionBtn: { flex: 1, alignItems: 'center', backgroundColor: Colors.surface, padding: Spacing.lg, borderRadius: BorderRadius.xl, gap: Spacing.sm },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textMain },
  section: { marginHorizontal: Spacing.lg, marginTop: Spacing.xxl, marginBottom: Spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textMain },
  seeAll: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyText: { fontSize: FontSizes.md, color: Colors.textDim },
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txnIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1, marginLeft: Spacing.md },
  txnDesc: { fontSize: FontSizes.sm, color: Colors.textMain, fontWeight: '500' },
  txnDate: { fontSize: FontSizes.xs, color: Colors.textDim, marginTop: 2 },
  txnAmount: { alignItems: 'flex-end' },
  txnAmountText: { fontSize: FontSizes.md, fontWeight: '700' },
  txnStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  txnStatusText: { fontSize: FontSizes.xs, fontWeight: '600' },
});
