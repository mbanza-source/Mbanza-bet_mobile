import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/useStore';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/src/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const menuItems = [
    { icon: 'shield-checkmark-outline' as const, label: 'KYC Verification', route: '/kyc', color: Colors.warning },
    { icon: 'notifications-outline' as const, label: 'Notifications', route: '/notifications', color: Colors.info },
    { icon: 'gift-outline' as const, label: 'Promotions', route: '/promotions', color: Colors.primary },
    { icon: 'receipt-outline' as const, label: 'Transaction History', route: '/transactions', color: Colors.success },
    { icon: 'help-circle-outline' as const, label: 'Support & FAQ', route: '/support', color: Colors.textMuted },
    { icon: 'alert-circle-outline' as const, label: 'Responsible Gaming', route: '/responsible-gaming', color: Colors.error },
  ];

  const kycColor = user?.kyc_status === 'approved' ? Colors.success : user?.kyc_status === 'submitted' ? Colors.warning : Colors.error;
  const kycLabel = user?.kyc_status === 'approved' ? 'Verified' : user?.kyc_status === 'submitted' ? 'Pending' : 'Not Verified';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <View style={[styles.kycBadge, { backgroundColor: `${kycColor}15` }]}>
              <View style={[styles.kycDot, { backgroundColor: kycColor }]} />
              <Text style={[styles.kycText, { color: kycColor }]}>{kycLabel}</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} testID={`profile-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textDim} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity testID="profile-logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MBANZA BET v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.textMain },
  userCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.primaryForeground },
  userInfo: { marginLeft: Spacing.lg, flex: 1 },
  userName: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textMain },
  userEmail: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
  kycBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  kycDot: { width: 6, height: 6, borderRadius: 3 },
  kycText: { fontSize: FontSizes.xs, fontWeight: '700' },
  menuSection: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: FontSizes.md, fontWeight: '600', color: Colors.textMain, marginLeft: Spacing.md },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginHorizontal: Spacing.lg, marginTop: Spacing.xxl, padding: Spacing.lg, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: BorderRadius.xl },
  logoutText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.error },
  version: { textAlign: 'center', fontSize: FontSizes.xs, color: Colors.textDim, marginTop: Spacing.xxl, marginBottom: Spacing.xxxl },
});
