import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '@/src/constants/theme';
import { Notification } from '@/src/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getNotifications().then(setNotifs).catch(console.error).finally(() => setLoading(false)); }, []);

  const handleRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const typeIcon = (type: string) => {
    const map: Record<string, { icon: any; color: string }> = {
      deposit: { icon: 'arrow-down-circle', color: Colors.success },
      withdrawal: { icon: 'arrow-up-circle', color: Colors.error },
      bet: { icon: 'football', color: Colors.primary },
      bet_settlement: { icon: 'trophy', color: Colors.success },
      promotion: { icon: 'gift', color: Colors.primary },
      system: { icon: 'information-circle', color: Colors.info },
    };
    return map[type] || { icon: 'notifications', color: Colors.textMuted };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity testID="notifs-back-btn" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={Colors.textMain} /></TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>
      {loading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={styles.list}>
          {notifs.length === 0 ? (
            <View style={styles.empty}><Ionicons name="notifications-off-outline" size={48} color={Colors.textDim} /><Text style={styles.emptyText}>No notifications</Text></View>
          ) : notifs.map(n => {
            const { icon, color } = typeIcon(n.type);
            return (
              <TouchableOpacity key={n.id} testID={`notif-${n.id}`} style={[styles.notifRow, !n.read && styles.unread]} onPress={() => handleRead(n.id)}>
                <View style={[styles.notifIcon, { backgroundColor: `${color}15` }]}><Ionicons name={icon} size={20} color={color} /></View>
                <View style={styles.notifInfo}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifMsg} numberOfLines={2}>{n.message}</Text>
                  <Text style={styles.notifDate}>{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                {!n.read && <View style={styles.unreadDot} />}
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
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { fontSize: FontSizes.md, color: Colors.textDim },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  unread: { backgroundColor: 'rgba(234,179,8,0.03)' },
  notifIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textMain },
  notifMsg: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  notifDate: { fontSize: FontSizes.xs, color: Colors.textDim, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6 },
});
