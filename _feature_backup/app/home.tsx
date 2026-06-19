import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

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
    <LinearGradient
      colors={['#5B9FFF', '#2060E0', '#1240BE']}
      style={styles.container}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
    >
      <StatusBar style="light" />

      <Animated.View style={[styles.titleWrap, headerStyle]}>
        <TitleLine first="구" rest="" />
        <TitleLine first="해" rest="요" />
        <TitleLine first="요" rest="기서" />
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
    justifyContent: 'space-around',
    paddingVertical: 64,
    paddingHorizontal: 28,
  },
  titleWrap: {
    alignItems: 'flex-start',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleFirst: {
    fontSize: 76,
    fontFamily: 'BlackHanSans_400Regular',
    color: '#FFFFFF',
    lineHeight: 88,
  },
  titleRest: {
    fontSize: 68,
    fontFamily: 'BlackHanSans_400Regular',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 88,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 14,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  btnArea: {
    width: '100%',
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1240BE',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 22,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
