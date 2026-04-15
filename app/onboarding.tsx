import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/useStore';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/src/constants/theme';

export default function Onboarding() {
  const router = useRouter();
  const setHasSeenOnboarding = useAuthStore((s) => s.setHasSeenOnboarding);

  const handleContinue = async () => {
    await setHasSeenOnboarding(true);
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={64} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Welcome to{'\n'}MBANZA BET</Text>
        <Text style={styles.subtitle}>Premium Sports Betting</Text>

        <View style={styles.features}>
          {[
            { icon: 'wallet-outline' as const, text: 'Secure Wallet System' },
            { icon: 'football-outline' as const, text: 'Soccer, Rugby, Boxing, Cricket & MMA' },
            { icon: 'flash-outline' as const, text: 'Instant Deposits & Withdrawals' },
            { icon: 'trophy-outline' as const, text: 'Best Odds Guaranteed' },
          ].map((item, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={item.icon} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ageGate}>
          <Ionicons name="warning" size={20} color={Colors.warning} />
          <Text style={styles.ageText}>You must be 18+ to use this app</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity testID="onboarding-continue-btn" style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>I am 18+ - Continue</Text>
        </TouchableOpacity>
        <Text style={styles.legalText}>By continuing, you agree to our Terms of Service and confirm you are of legal gambling age.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.xxl, justifyContent: 'center' },
  iconWrap: { marginBottom: Spacing.xxl },
  title: { fontSize: FontSizes.hero, fontWeight: '900', color: Colors.textMain, lineHeight: 42 },
  subtitle: { fontSize: FontSizes.lg, color: Colors.primary, marginTop: Spacing.sm, fontWeight: '600' },
  features: { marginTop: Spacing.xxxl, gap: Spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: { width: 40, height: 40, borderRadius: BorderRadius.lg, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: FontSizes.lg, color: Colors.textSecondary, fontWeight: '500' },
  ageGate: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xxxl, backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: Spacing.md, borderRadius: BorderRadius.md },
  ageText: { fontSize: FontSizes.md, color: Colors.warning, fontWeight: '600' },
  bottom: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  primaryBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.primaryForeground, textTransform: 'uppercase', letterSpacing: 1 },
  legalText: { fontSize: FontSizes.xs, color: Colors.textDim, textAlign: 'center', marginTop: Spacing.md, lineHeight: 16 },
});
