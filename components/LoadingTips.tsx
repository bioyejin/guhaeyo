import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LOADING_TIPS } from '../constants/surveyData';
import { useFontScale } from '../contexts/FontScaleContext';
import { colors, FONT } from '../constants/colors';

const { width } = Dimensions.get('window');

export default function LoadingTips() {
  const [shuffledTips] = useState<string[]>(
    () => [...LOADING_TIPS].sort(() => Math.random() - 0.5)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const translateY = useSharedValue(-40);
  const opacity = useSharedValue(0);
  const { fontScale } = useFontScale();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const showTip = (index: number) => {
    setDisplayIndex(index);
    translateY.value = -40;
    opacity.value = 0;
    translateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 400 });
  };

  useEffect(() => {
    showTip(0);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % shuffledTips.length;
        opacity.value = withTiming(0, { duration: 300 }, (done) => {
          if (done) runOnJS(showTip)(next);
        });
        return next;
      });
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.tipWrap, animStyle]}>
        <Text style={[styles.tip, { fontSize: 18 * fontScale }]}>{shuffledTips[displayIndex]}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.85,
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tipWrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tip: {
    fontFamily: FONT,
    color: colors.textMid,
    textAlign: 'center',
    lineHeight: 32,
  },
});
