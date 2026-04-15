import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/src/constants/theme';

const faqs = [
  { q: 'How do I deposit funds?', a: 'Go to Wallet > Deposit. Choose your preferred payment method and enter the amount.' },
  { q: 'How long do withdrawals take?', a: 'Withdrawals are processed within 24-48 hours after KYC verification.' },
  { q: 'What is the minimum bet?', a: 'The minimum stake is NAD 5 per bet.' },
  { q: 'How do I verify my account?', a: 'Go to Profile > KYC Verification and upload your ID documents.' },
  { q: 'Can I cancel a placed bet?', a: 'Once a bet is placed and confirmed, it cannot be cancelled.' },
];

export default function SupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="support-back-btn" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.textMain} /></TouchableOpacity>
        <Text style={styles.title}>Support</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          {[
            { icon: 'mail' as const, label: 'Email Support', value: 'support@mbanza.bet', onPress: () => Linking.openURL('mailto:support@mbanza.bet') },
            { icon: 'logo-whatsapp' as const, label: 'WhatsApp', value: '+264 81 123 4567', onPress: () => Linking.openURL('https://wa.me/264811234567') },
            { icon: 'call' as const, label: 'Phone', value: '+264 81 123 4567', onPress: () => Linking.openURL('tel:+264811234567') },
          ].map((item, i) => (
            <TouchableOpacity key={i} testID={`support-contact-${i}`} style={styles.contactCard} onPress={item.onPress}>
              <View style={styles.contactIcon}><Ionicons name={item.icon} size={22} color={Colors.primary} /></View>
              <View style={{ flex: 1 }}><Text style={styles.contactLabel}>{item.label}</Text><Text style={styles.contactValue}>{item.value}</Text></View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, i) => (
          <View key={i} testID={`faq-${i}`} style={styles.faqCard}>
            <Text style={styles.faqQ}>{faq.q}</Text>
            <Text style={styles.faqA}>{faq.a}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  title: { flex: 1, fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.textMain, textAlign: 'center' },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  contactSection: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textMain, marginBottom: Spacing.md },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  contactIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(234,179,8,0.1)', alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textMain },
  contactValue: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
  faqCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  faqQ: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMain },
  faqA: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: Spacing.sm, lineHeight: 20 },
});
