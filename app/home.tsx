import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors, FONT } from '../constants/colors';
import AppIcon from '../components/AppIcon';

export default function HomeScreen() {
  const router = useRouter();

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-20);
  const btn1Opacity = useSharedValue(0);
  const btn1Y = useSharedValue(40);
  const btn2Opacity = useSharedValue(0);
  const btn2Y = useSharedValue(40);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));
  const btn1Style = useAnimatedStyle(() => ({
    opacity: btn1Opacity.value,
    transform: [{ translateY: btn1Y.value }],
  }));
  const btn2Style = useAnimatedStyle(() => ({
    opacity: btn2Opacity.value,
    transform: [{ translateY: btn2Y.value }],
  }));

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    headerOpacity.value = withTiming(1, { duration: 600, easing: ease });
    headerY.value = withTiming(0, { duration: 600, easing: ease });
    btn1Opacity.value = withDelay(300, withTiming(1, { duration: 600, easing: ease }));
    btn1Y.value = withDelay(300, withTiming(0, { duration: 600, easing: ease }));
    btn2Opacity.value = withDelay(500, withTiming(1, { duration: 600, easing: ease }));
    btn2Y.value = withDelay(500, withTiming(0, { duration: 600, easing: ease }));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Image
        source={require('../assets/images/flower_bg.png')}
        style={[StyleSheet.absoluteFillObject, styles.flowerBg]}
        resizeMode="cover"
      />

      <Animated.View style={[styles.titleWrap, headerStyle]}>
        <AppIcon size={180} borderRadius={36} />
        <Text style={styles.tagline}>나에게 딱 맞는 일자리 찾기</Text>
      </Animated.View>

      <View style={styles.btnArea}>
        <Animated.View style={btn1Style}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/survey/text')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>일자리 찾기</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={btn2Style}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/survey/voice')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>음성으로 찾기</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 64,
    paddingHorizontal: 28,
    backgroundColor: colors.bg,
  },
  flowerBg: { opacity: 0.06 },
  titleWrap: {
    alignItems: 'center',
  },
  tagline: {
    fontFamily: FONT,
    color: colors.textLight,
    marginTop: 40,
    letterSpacing: 1.5,
    fontSize: 30,
  },
  btnArea: {
    width: '100%',
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: FONT,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontSize: 26,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 22,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: FONT,
    color: colors.primary,
    letterSpacing: 0.5,
    fontSize: 26,
  },
});
