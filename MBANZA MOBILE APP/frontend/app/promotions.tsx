import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/src/constants/theme';
import { Promotion } from '@/src/types';

export default function PromotionsScreen() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getPromotions().then(setPromos).catch(console.error).finally(() => setLoading(false)); }, []);

  const typeColors: Record<string, string> = { welcome: Colors.primary, deposit: Colors.success, free_bet: Colors.info, cashback: Colors.warning };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="promos-back-btn" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.textMain} /></TouchableOpacity>
        <Text style={styles.title}>Promotions</Text>
        <View style={{ width: 44 }} />
      </View>
      {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={styles.list}>
          {promos.map(p => (
            <View key={p.id} testID={`promo-${p.id}`} style={styles.promoCard}>
              <View style={[styles.promoBadge, { backgroundColor: `${typeColors[p.type] || Colors.primary}20` }]}>
                <Ionicons name="gift" size={24} color={typeColors[p.type] || Colors.primary} />
              </View>
              <Text style={styles.promoTitle}>{p.title}</Text>
              <Text style={styles.promoDesc}>{p.description}</Text>
              <View style={styles.termsBox}><Text style={styles.termsText}>{p.terms}</Text></View>
            </View>
          ))}
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
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  promoCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  promoBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  promoTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.primary },
  promoDesc: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 22 },
  termsBox: { marginTop: Spacing.md, padding: Spacing.md, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md },
  termsText: { fontSize: FontSizes.xs, color: Colors.textDim, lineHeight: 16 },
});
