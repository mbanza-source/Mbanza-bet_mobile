import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius, formatCurrency } from '@/src/constants/theme';
import { Transaction } from '@/src/types';

const filterTabs = ['all', 'deposit', 'withdrawal', 'stake', 'winning'];

export default function TransactionsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (type?: string) => {
    try { setTransactions(await api.getTransactions(type)); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { loadData(filter); }, [filter]);
  const onRefresh = async () => { setRefreshing(true); await loadData(filter); setRefreshing(false); };

  const txnIcon = (type: string) => {
    const map: Record<string, { icon: any; color: string }> = {
      deposit: { icon: 'arrow-down-circle', color: Colors.success },
      withdrawal: { icon: 'arrow-up-circle', color: Colors.error },
      stake: { icon: 'football', color: Colors.warning },
      winning: { icon: 'trophy', color: Colors.success },
      refund: { icon: 'refresh-circle', color: Colors.info },
    };
    return map[type] || { icon: 'swap-horizontal', color: Colors.textMuted };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="txns-back-btn" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.textMain} /></TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filterTabs.map(f => (
          <TouchableOpacity key={f} testID={`txn-filter-${f}`} style={[styles.filterChip, filter === f && styles.filterActive]} onPress={() => { setFilter(f); setLoading(true); }}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />} contentContainerStyle={styles.list}>
          {transactions.length === 0 ? (
            <View style={styles.empty}><Ionicons name="receipt-outline" size={48} color={Colors.textDim} /><Text style={styles.emptyText}>No transactions</Text></View>
          ) : transactions.map(txn => {
            const { icon, color } = txnIcon(txn.type);
            return (
              <View key={txn.id} testID={`txn-item-${txn.id}`} style={styles.txnRow}>
                <View style={[styles.txnIcon, { backgroundColor: `${color}15` }]}><Ionicons name={icon} size={20} color={color} /></View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnDesc} numberOfLines={1}>{txn.description}</Text>
                  <Text style={styles.txnDate}>{new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={[styles.txnAmount, { color: txn.amount >= 0 ? Colors.success : Colors.error }]}>{txn.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  title: { flex: 1, fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.textMain, textAlign: 'center' },
  filterRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  filterChip: { paddingHorizontal: Spacing.lg, height: 36, borderRadius: 18, backgroundColor: Colors.surface, justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: Colors.primaryForeground },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { fontSize: FontSizes.md, color: Colors.textDim },
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txnIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1, marginLeft: Spacing.md },
  txnDesc: { fontSize: FontSizes.sm, color: Colors.textMain, fontWeight: '500' },
  txnDate: { fontSize: FontSizes.xs, color: Colors.textDim, marginTop: 2 },
  txnAmount: { fontSize: FontSizes.md, fontWeight: '700' },
});
