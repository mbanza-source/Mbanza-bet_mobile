import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/useStore';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/src/constants/theme';

export default function Login() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your credentials');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.login({ identifier: identifier.trim(), password });
      await setToken(res.token);
      setUser(res.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoLetter}>M</Text>
            </View>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Welcome back to MBANZA BET</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email, Phone or Username</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={Colors.textDim} />
                <TextInput
                  testID="login-identifier-input"
                  style={styles.input}
                  placeholder="Enter your email, phone or username"
                  placeholderTextColor={Colors.textDim}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textDim} />
                <TextInput
                  testID="login-password-input"
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textDim}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity testID="login-toggle-password" onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textDim} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity testID="login-forgot-password-link" onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity testID="login-submit-btn" style={styles.primaryBtn} onPress={handleLogin} activeOpacity={0.8} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.primaryForeground} /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity testID="login-register-link" onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.linkText}> Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xxl, justifyContent: 'center' },
  header: { marginBottom: Spacing.xxxl },
  logoIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  logoLetter: { fontSize: 28, fontWeight: '900', color: Colors.primaryForeground },
  title: { fontSize: FontSizes.xxxl, fontWeight: '900', color: Colors.textMain },
  subtitle: { fontSize: FontSizes.md, color: Colors.textMuted, marginTop: Spacing.xs },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: 'rgba(239,68,68,0.1)', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg },
  errorText: { fontSize: FontSizes.sm, color: Colors.error, flex: 1 },
  form: { gap: Spacing.xl },
  inputGroup: { gap: Spacing.sm },
  label: { fontSize: FontSizes.sm, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBg, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, height: 52, gap: Spacing.sm },
  input: { flex: 1, fontSize: FontSizes.lg, color: Colors.textMain },
  forgotText: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: '600', textAlign: 'right' },
  primaryBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  primaryBtnText: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.primaryForeground, textTransform: 'uppercase', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xxxl },
  footerText: { fontSize: FontSizes.md, color: Colors.textMuted },
  linkText: { fontSize: FontSizes.md, color: Colors.primary, fontWeight: '700' },
});
