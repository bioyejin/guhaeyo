import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export default function SplashScreen() {
  const router = useRouter();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });

    const timer = setTimeout(() => {
      router.replace('/home');
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#5B9FFF', '#2060E0', '#1240BE']}
      style={styles.container}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
    >
      <StatusBar style="light" />
      <Animated.View style={[styles.titleWrap, animStyle]}>
        <TitleLine first="구" rest="" />
        <TitleLine first="해" rest="요" />
        <TitleLine first="요" rest="기서" />
      </Animated.View>
      <Animated.Text style={[styles.tagline, animStyle]}>
        나에게 딱 맞는 일자리 찾기
      </Animated.Text>
    </LinearGradient>
  );
}

function TitleLine({ first, rest }: { first: string; rest: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.titleFirst}>{first}</Text>
      {rest ? <Text style={styles.titleRest}>{rest}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleFirst: {
    fontSize: 84,
    fontFamily: 'BlackHanSans_400Regular',
    color: '#FFFFFF',
    lineHeight: 96,
  },
  titleRest: {
    fontSize: 76,
    fontFamily: 'BlackHanSans_400Regular',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 96,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    fontWeight: '500',
  },
});
