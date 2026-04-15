import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/useStore';
import { Colors, FontSizes } from '@/src/constants/theme';

export default function SplashIndex() {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasSeenOnboarding } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else if (hasSeenOnboarding) {
          router.replace('/(auth)/login');
        } else {
          router.replace('/onboarding');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, hasSeenOnboarding]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoLetter}>M</Text>
        </View>
        <Text style={styles.brandName}>MBANZA BET</Text>
        <Text style={styles.tagline}>Premium Sports Betting</Text>
      </Animated.View>
      <View style={styles.footer}>
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingFill, { opacity: fadeAnim }]} />
        </View>
        <Text style={styles.footerText}>18+ | Play Responsibly</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center' },
  logoIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoLetter: { fontSize: 42, fontWeight: '900', color: Colors.primaryForeground },
  brandName: { fontSize: FontSizes.hero, fontWeight: '900', color: Colors.textMain, letterSpacing: 2 },
  tagline: { fontSize: FontSizes.md, color: Colors.primary, marginTop: 8, letterSpacing: 1 },
  footer: { position: 'absolute', bottom: 60, alignItems: 'center' },
  loadingBar: { width: 120, height: 3, backgroundColor: Colors.surface, borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  loadingFill: { width: '100%', height: '100%', backgroundColor: Colors.primary },
  footerText: { fontSize: FontSizes.xs, color: Colors.textDim },
});
