import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/src/constants/theme';

export default function KYCScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getKYCStatus().then(setStatus).catch(console.error).finally(() => setLoading(false)); }, []);

  const statusColor = status?.kyc_status === 'approved' ? Colors.success : status?.kyc_status === 'submitted' ? Colors.warning : Colors.error;
  const statusLabel = status?.kyc_status === 'approved' ? 'Verified' : status?.kyc_status === 'submitted' ? 'Under Review' : 'Not Verified';

  const handleUpload = async (type: string) => {
    try {
      await api.uploadKYC({ document_type: type, file_data: 'placeholder_base64_data' });
      Alert.alert('Submitted', 'Document submitted for review');
      const s = await api.getKYCStatus();
      setStatus(s);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const docs = [
    { type: 'id_card', name: 'National ID Card', icon: 'id-card' as const },
    { type: 'passport', name: 'Passport', icon: 'document-text' as const },
    { type: 'drivers_license', name: "Driver's License", icon: 'car' as const },
    { type: 'proof_of_address', name: 'Proof of Address', icon: 'home' as const },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="kyc-back-btn" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.textMain} /></TouchableOpacity>
        <Text style={styles.title}>KYC Verification</Text>
        <View style={{ width: 44 }} />
      </View>
      {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusCard}>
            <View style={[styles.statusIcon, { backgroundColor: `${statusColor}15` }]}><Ionicons name="shield-checkmark" size={32} color={statusColor} /></View>
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
            <Text style={styles.statusDesc}>{status?.kyc_status === 'approved' ? 'Your identity has been verified. You can now withdraw funds.' : status?.kyc_status === 'submitted' ? 'Your documents are being reviewed. This usually takes 24-48 hours.' : 'Please upload your documents to verify your identity and enable withdrawals.'}</Text>
          </View>
          <Text style={styles.sectionTitle}>Upload Documents</Text>
          {docs.map(d => {
            const uploaded = status?.documents?.find((doc: any) => doc.document_type === d.type);
            return (
              <TouchableOpacity key={d.type} testID={`kyc-upload-${d.type}`} style={styles.docCard} onPress={() => !uploaded && handleUpload(d.type)}>
                <View style={styles.docIcon}><Ionicons name={d.icon} size={22} color={Colors.textMuted} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docName}>{d.name}</Text>
                  <Text style={styles.docStatus}>{uploaded ? `Status: ${uploaded.status}` : 'Not uploaded'}</Text>
                </View>
                {uploaded ? <Ionicons name="checkmark-circle" size={22} color={uploaded.status === 'approved' ? Colors.success : Colors.warning} /> : <Ionicons name="cloud-upload-outline" size={22} color={Colors.primary} />}
              </TouchableOpacity>
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
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  statusCard: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xxl, padding: Spacing.xxl, marginBottom: Spacing.xxl, borderWidth: 1, borderColor: Colors.border },
  statusIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  statusLabel: { fontSize: FontSizes.xl, fontWeight: '800' },
  statusDesc: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.textMain, marginBottom: Spacing.md },
  docCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  docIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textMain },
  docStatus: { fontSize: FontSizes.xs, color: Colors.textDim, marginTop: 2 },
});
