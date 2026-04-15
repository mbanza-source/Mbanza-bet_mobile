import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/src/constants/theme';

export default function ResponsibleGaming() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="rg-back-btn" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.textMain} /></TouchableOpacity>
        <Text style={styles.title}>Responsible Gaming</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.ageCard}>
          <Ionicons name="warning" size={40} color={Colors.warning} />
          <Text style={styles.ageTitle}>18+ Only</Text>
          <Text style={styles.ageDesc}>You must be 18 years or older to use MBANZA BET. Gambling is restricted to legal adults only.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Play Responsibly</Text>
          <Text style={styles.bodyText}>Gambling should be entertaining, not a way to make money. Set limits, take breaks, and never bet more than you can afford to lose.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Responsible Gaming</Text>
          {[
            'Set a budget before you start and stick to it',
            'Never chase losses',
            'Take regular breaks from betting',
            'Do not borrow money to gamble',
            'Balance gambling with other activities',
            'Keep track of time and money spent',
            'Seek help if gambling stops being fun',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <Text style={styles.bodyText}>If you or someone you know has a gambling problem, please reach out:</Text>
          <View style={styles.helpCard}>
            <Ionicons name="call" size={22} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.helpLabel}>Gambling Helpline</Text>
              <Text style={styles.helpValue}>0800 006 008 (Toll Free)</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity testID="rg-terms" style={styles.linkRow}>
            <Text style={styles.linkText}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
          </TouchableOpacity>
          <TouchableOpacity testID="rg-privacy" style={styles.linkRow}>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  title: { flex: 1, fontSize: FontSizes.xl, fontWeight: '900', color: Colors.textMain, textAlign: 'center' },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  ageCard: { alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: BorderRadius.xxl, padding: Spacing.xxl, marginBottom: Spacing.xxl, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  ageTitle: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.warning, marginTop: Spacing.md },
  ageDesc: { fontSize: FontSizes.md, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textMain, marginBottom: Spacing.md },
  bodyText: { fontSize: FontSizes.md, color: Colors.textMuted, lineHeight: 22 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  tipText: { fontSize: FontSizes.md, color: Colors.textSecondary, flex: 1, lineHeight: 22 },
  helpCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  helpLabel: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textMain },
  helpValue: { fontSize: FontSizes.sm, color: Colors.primary, marginTop: 2 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  linkText: { fontSize: FontSizes.md, color: Colors.textMain, fontWeight: '500' },
});
