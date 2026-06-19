import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
    <View style={styles.container}>
      <StatusBar style="dark" />

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
            <Text style={styles.primaryBtnIcon}>💼</Text>
            <Text style={styles.primaryBtnText}>일자리 찾기</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={btn2Style}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/survey/voice')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnIcon}>🎤</Text>
            <Text style={styles.secondaryBtnText}>음성으로 찾기</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
    justifyContent: 'space-around',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  titleWrap: {
    alignItems: 'flex-start',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleFirst: {
    fontSize: 72,
    fontFamily: 'Jua_400Regular',
    color: '#2E7D32',
    lineHeight: 84,
  },
  titleRest: {
    fontSize: 64,
    fontFamily: 'Jua_400Regular',
    color: '#4CAF50',
    lineHeight: 84,
  },
  tagline: {
    fontSize: 22,
    color: '#66BB6A',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  btnArea: {
    width: '100%',
    gap: 20,
  },
  primaryBtn: {
    backgroundColor: '#43A047',
    borderRadius: 24,
    paddingVertical: 22,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  primaryBtnIcon: { fontSize: 30 },
  primaryBtnText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#43A047',
    paddingVertical: 22,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  secondaryBtnIcon: { fontSize: 30 },
  secondaryBtnText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#43A047',
  },
});
