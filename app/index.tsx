import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, FONT } from '../constants/colors';
import AppIcon from '../components/AppIcon';

export default function SplashScreen() {
  const router = useRouter();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 1400, easing: Easing.out(Easing.cubic) });

    const timer = setTimeout(() => {
      router.replace('/home');
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Image
        source={require('../assets/images/flower_bg.png')}
        style={[StyleSheet.absoluteFillObject, styles.flowerBg]}
        resizeMode="cover"
      />
      <Animated.View style={[styles.iconWrap, animStyle]}>
        <AppIcon size={220} borderRadius={44} />
      </Animated.View>
      <Animated.Text style={[styles.tagline, animStyle]}>
        나에게 딱 맞는 일자리 찾기
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  flowerBg: { opacity: 0.06 },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 44,
  },
  tagline: {
    fontSize: 30,
    fontFamily: FONT,
    color: colors.textLight,
    letterSpacing: 2,
  },
});
