import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/src/constants/theme';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Please enter your email'); return; }
    setLoading(true); setError('');
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          <TouchableOpacity testID="forgot-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>

          {sent ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              <Text style={styles.successText}>Reset link sent! Check your email.</Text>
              <TouchableOpacity testID="forgot-back-login-btn" style={styles.primaryBtn} onPress={() => router.back()}>
                <Text style={styles.primaryBtnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Colors.textDim} />
                <TextInput testID="forgot-email-input" style={styles.input} placeholder="Enter your email" placeholderTextColor={Colors.textDim} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              </View>
              <TouchableOpacity testID="forgot-submit-btn" style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.primaryForeground} /> : <Text style={styles.primaryBtnText}>Send Reset Link</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSizes.xxxl, fontWeight: '900', color: Colors.textMain },
  subtitle: { fontSize: FontSizes.md, color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.xxxl },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg },
  errorText: { fontSize: FontSizes.sm, color: Colors.error },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, height: 52, gap: Spacing.sm, marginBottom: Spacing.xl },
  input: { flex: 1, fontSize: FontSizes.lg, color: Colors.textMain },
  primaryBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.primaryForeground, textTransform: 'uppercase', letterSpacing: 1 },
  successBox: { alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.xxxl },
  successText: { fontSize: FontSizes.lg, color: Colors.textMain, textAlign: 'center' },
});
