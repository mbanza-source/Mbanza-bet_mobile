import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/useStore';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/src/constants/theme';

export default function Register() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.register({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, password });
      await setToken(res.token);
      setUser(res.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="register-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textMain} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join MBANZA BET and start winning</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={Colors.textDim} />
                <TextInput testID="register-name-input" style={styles.input} placeholder="Enter your full name" placeholderTextColor={Colors.textDim} value={name} onChangeText={setName} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Colors.textDim} />
                <TextInput testID="register-email-input" style={styles.input} placeholder="Enter your email" placeholderTextColor={Colors.textDim} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={18} color={Colors.textDim} />
                <TextInput testID="register-phone-input" style={styles.input} placeholder="+264 81 234 5678" placeholderTextColor={Colors.textDim} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textDim} />
                <TextInput testID="register-password-input" style={styles.input} placeholder="Create a strong password" placeholderTextColor={Colors.textDim} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textDim} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.terms}>
              <Ionicons name="checkbox" size={20} color={Colors.primary} />
              <Text style={styles.termsText}>I confirm I am 18+ and agree to the Terms of Service</Text>
            </View>

            <TouchableOpacity testID="register-submit-btn" style={styles.primaryBtn} onPress={handleRegister} activeOpacity={0.8} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.primaryForeground} /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity testID="register-login-link" onPress={() => router.back()}>
              <Text style={styles.linkText}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  header: { marginBottom: Spacing.xxl, marginTop: Spacing.sm },
  title: { fontSize: FontSizes.xxxl, fontWeight: '900', color: Colors.textMain },
  subtitle: { fontSize: FontSizes.md, color: Colors.textMuted, marginTop: Spacing.xs },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: 'rgba(239,68,68,0.1)', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg },
  errorText: { fontSize: FontSizes.sm, color: Colors.error, flex: 1 },
  form: { gap: Spacing.lg },
  inputGroup: { gap: Spacing.sm },
  label: { fontSize: FontSizes.sm, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, height: 52, gap: Spacing.sm },
  input: { flex: 1, fontSize: FontSizes.lg, color: Colors.textMain },
  terms: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  termsText: { fontSize: FontSizes.sm, color: Colors.textMuted, flex: 1 },
  primaryBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.primaryForeground, textTransform: 'uppercase', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xxxl, paddingBottom: Spacing.xxxl },
  footerText: { fontSize: FontSizes.md, color: Colors.textMuted },
  linkText: { fontSize: FontSizes.md, color: Colors.primary, fontWeight: '700' },
});
