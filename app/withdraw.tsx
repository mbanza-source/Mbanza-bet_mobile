import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore, useAuthStore } from '@/src/store/useStore';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius, formatCurrency } from '@/src/constants/theme';

export default function WithdrawScreen() {
  const router = useRouter();
  const { wallet, setWallet } = useWalletStore();
  const user = useAuthStore(s => s.user);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum < 50) { Alert.alert('Error', 'Minimum withdrawal is NAD 50'); return; }
    if (amtNum > (wallet?.available_balance || 0)) { Alert.alert('Error', 'Insufficient balance'); return; }
    setLoading(true);
    try {
      const res = await api.requestWithdrawal({ amount: amtNum, method });
      setWallet({ ...wallet!, balance: res.balance, available_balance: res.balance });
      Alert.alert('Withdrawal Requested', `${formatCurrency(amtNum)} withdrawal is being processed`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const kycRequired = user?.kyc_status !== 'approved';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity testID="withdraw-back-btn" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.textMain} /></TouchableOpacity>
          <Text style={styles.title}>Withdraw</Text>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.balanceText}>Available: {formatCurrency(wallet?.available_balance || 0)}</Text>
          {kycRequired && (
            <TouchableOpacity testID="withdraw-kyc-alert" style={styles.kycAlert} onPress={() => router.push('/kyc')}>
              <Ionicons name="warning" size={20} color={Colors.warning} />
              <Text style={styles.kycAlertText}>KYC verification required for withdrawals. Tap to verify.</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.warning} />
            </TouchableOpacity>
          )}
          <Text style={styles.label}>Amount (NAD)</Text>
          <View style={styles.amountWrap}>
            <Text style={styles.prefix}>NAD</Text>
            <TextInput testID="withdraw-amount-input" style={styles.amountInput} placeholder="0.00" placeholderTextColor={Colors.textDim} value={amount} onChangeText={setAmount} keyboardType="numeric" />
          </View>
          <Text style={styles.label2}>Withdrawal Method</Text>
          {[
            { id: 'bank_transfer', name: 'Bank Transfer', icon: 'business' as const },
            { id: 'mobile_money', name: 'Mobile Money', icon: 'phone-portrait' as const },
            { id: 'crypto', name: 'Cryptocurrency', icon: 'logo-bitcoin' as const },
          ].map(m => (
            <TouchableOpacity key={m.id} testID={`withdraw-method-${m.id}`} style={[styles.methodCard, method === m.id && styles.methodActive]} onPress={() => setMethod(m.id)}>
              <Ionicons name={m.icon} size={20} color={method === m.id ? Colors.primary : Colors.textDim} />
              <Text style={[styles.methodText, method === m.id && { color: Colors.textMain }]}>{m.name}</Text>
              <Ionicons name={method === m.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={method === m.id ? Colors.primary : Colors.textDim} />
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity testID="withdraw-submit-btn" style={[styles.submitBtn, (loading || kycRequired) && { opacity: 0.5 }]} onPress={handleWithdraw} disabled={loading || kycRequired}>
            {loading ? <ActivityIndicator color={Colors.primaryForeground} /> : <Text style={styles.submitText}>Request Withdrawal</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  title: { flex: 1, fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.textMain, textAlign: 'center' },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  balanceText: { fontSize: FontSizes.md, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.lg },
  kycAlert: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: 'rgba(245,158,11,0.1)', padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  kycAlertText: { flex: 1, fontSize: FontSizes.sm, color: Colors.warning, fontWeight: '500' },
  label: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.sm },
  label2: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.sm, marginTop: Spacing.xl },
  amountWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.primary, height: 64, paddingHorizontal: Spacing.lg },
  prefix: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.primary, marginRight: Spacing.sm },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '900', color: Colors.textMain },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  methodActive: { borderColor: Colors.primary },
  methodText: { flex: 1, fontSize: FontSizes.md, fontWeight: '600', color: Colors.textMuted },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.primaryForeground, textTransform: 'uppercase' },
});
