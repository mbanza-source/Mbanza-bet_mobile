import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/src/store/useStore';
import { Colors } from '@/src/constants/theme';

export default function RootLayout() {
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="betslip" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="deposit" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="withdraw" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="transactions" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="promotions" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="kyc" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="support" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="responsible-gaming" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
