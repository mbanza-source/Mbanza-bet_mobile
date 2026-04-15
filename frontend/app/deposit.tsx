import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/src/store/useStore';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius, formatCurrency } from '@/src/constants/theme';

const methods = [
  { id: 'card', name: 'Card Payment', icon: 'card' as const, desc: 'Visa, Mastercard' },
  { id: 'mobile_money', name: 'Mobile Money', icon: 'phone-portrait' as const, desc: 'M-Pesa, MTN, Airtel' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: 'business' as const, desc: 'Direct bank deposit' },
  { id: 'crypto', name: 'Cryptocurrency', icon: 'logo-bitcoin' as const, desc: 'BTC, USDT, ETH' },
];

export default function DepositScreen() {
  const router = useRouter();
  const { wallet, setWallet } = useWalletStore();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum < 10) { Alert.alert('Error', 'Minimum deposit is NAD 10'); return; }
    setLoading(true);
    try {
      const res = await api.initiateDeposit({ amount: amtNum, method });
      setWallet({ ...wallet!, balance: res.balance, available_balance: res.balance });
      Alert.alert('Deposit Successful', `${formatCurrency(amtNum)} has been added to your wallet`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const quickAmounts = [100, 250, 500, 1000];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity testID="deposit-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.title}>Deposit</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.balanceText}>Balance: {formatCurrency(wallet?.balance || 0)}</Text>

          <Text style={styles.label}>Amount (NAD)</Text>
          <View style={styles.amountWrap}>
            <Text style={styles.prefix}>NAD</Text>
            <TextInput testID="deposit-amount-input" style={styles.amountInput} placeholder="0.00" placeholderTextColor={Colors.textDim} value={amount} onChangeText={setAmount} keyboardType="numeric" />
          </View>
          <View style={styles.quickRow}>
            {quickAmounts.map((qa) => (
              <TouchableOpacity key={qa} testID={`deposit-quick-${qa}`} style={styles.quickBtn} onPress={() => setAmount(qa.toString())}>
                <Text style={styles.quickText}>{qa}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: Spacing.xl }]}>Payment Method</Text>
          {methods.map((m) => (
            <TouchableOpacity key={m.id} testID={`deposit-method-${m.id}`} style={[styles.methodCard, method === m.id && styles.methodActive]} onPress={() => setMethod(m.id)}>
              <View style={styles.methodIcon}><Ionicons name={m.icon} size={22} color={method === m.id ? Colors.primary : Colors.textMuted} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodName, method === m.id && { color: Colors.textMain }]}>{m.name}</Text>
                <Text style={styles.methodDesc}>{m.desc}</Text>
              </View>
              <Ionicons name={method === m.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={method === m.id ? Colors.primary : Colors.textDim} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity testID="deposit-submit-btn" style={[styles.submitBtn, loading && { opacity: 0.5 }]} onPress={handleDeposit} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.primaryForeground} /> : <Text style={styles.submitText}>Deposit {amount ? formatCurrency(parseFloat(amount) || 0) : ''}</Text>}
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
  balanceText: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl },
  label: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.sm },
  amountWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.primary, height: 64, paddingHorizontal: Spacing.lg },
  prefix: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.primary, marginRight: Spacing.sm },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '900', color: Colors.textMain },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  quickBtn: { flex: 1, height: 40, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMain },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  methodActive: { borderColor: Colors.primary, backgroundColor: 'rgba(234,179,8,0.05)' },
  methodIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  methodName: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMuted },
  methodDesc: { fontSize: FontSizes.xs, color: Colors.textDim, marginTop: 2 },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.primaryForeground, textTransform: 'uppercase' },
});
