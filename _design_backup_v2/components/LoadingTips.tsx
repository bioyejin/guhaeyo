import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LOADING_TIPS } from '../constants/surveyData';

const { width } = Dimensions.get('window');

export default function LoadingTips() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const showTip = (index: number) => {
    setDisplayIndex(index);
    translateY.value = -60;
    opacity.value = 0;
    translateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 400 });
  };

  useEffect(() => {
    showTip(0);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % LOADING_TIPS.length;
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
      <Animated.View style={[styles.tipBox, animStyle]}>
        <Text style={styles.tip}>{LOADING_TIPS[displayIndex]}</Text>
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
  tipBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: '100%',
  },
  tip: {
    fontSize: 20,
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 30,
  },
});
