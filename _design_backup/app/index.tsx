import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.titleWrap, animStyle]}>
        <TitleLine first="구" rest="" />
        <TitleLine first="해" rest="요" />
        <TitleLine first="요" rest="기서" />
      </Animated.View>
      <Animated.Text style={[styles.tagline, animStyle]}>
        나에게 딱 맞는 일자리 찾기
      </Animated.Text>
    </View>
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
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleFirst: {
    fontSize: 80,
    fontFamily: 'Jua_400Regular',
    color: '#2E7D32',
    lineHeight: 92,
  },
  titleRest: {
    fontSize: 72,
    fontFamily: 'Jua_400Regular',
    color: '#4CAF50',
    lineHeight: 92,
  },
  tagline: {
    fontSize: 22,
    color: '#66BB6A',
    letterSpacing: 1,
  },
});
