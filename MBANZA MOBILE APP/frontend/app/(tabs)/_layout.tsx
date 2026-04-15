import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBetSlipStore } from '@/src/store/useStore';
import { Colors, FontSizes } from '@/src/constants/theme';

function TabIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
  return <Ionicons name={name} size={24} color={color} />;
}

export default function TabLayout() {
  const selectionsCount = useBetSlipStore((s) => s.selections.length);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />,
          tabBarTestID: 'tab-home',
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabIcon name={focused ? 'flash' : 'flash-outline'} color={color} focused={focused} />
              <View style={styles.liveDot} />
            </View>
          ),
          tabBarTestID: 'tab-live',
        }}
      />
      <Tabs.Screen
        name="bets"
        options={{
          title: 'Bets',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabIcon name={focused ? 'receipt' : 'receipt-outline'} color={color} focused={focused} />
              {selectionsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{selectionsCount}</Text>
                </View>
              )}
            </View>
          ),
          tabBarTestID: 'tab-bets',
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'wallet' : 'wallet-outline'} color={color} focused={focused} />,
          tabBarTestID: 'tab-wallet',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />,
          tabBarTestID: 'tab-profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: { fontSize: FontSizes.xs, fontWeight: '600' },
  liveDot: { position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accentLive },
  badge: { position: 'absolute', top: -4, right: -10, backgroundColor: Colors.primary, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: 10, fontWeight: '800', color: Colors.primaryForeground },
});
