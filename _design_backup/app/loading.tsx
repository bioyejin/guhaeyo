import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useAppContext } from './_layout';
import LoadingTips from '../components/LoadingTips';
import {
  loadCSV,
  getUniqueJobTypes,
  filterByJobTypes,
  filterByRegion,
  filterBySido,
  sampleJobs,
} from '../utils/csvParser';
import { step1SelectJobTypes, step3ScoreJobs } from '../utils/llmService';

export default function LoadingScreen() {
  const router = useRouter();
  const { surveyAnswers, setResults, csvData } = useAppContext();
  const [errorMsg, setErrorMsg] = useState('');
  const [retrying, setRetrying] = useState(false);

  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  const dotStyle1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const dotStyle2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const dotStyle3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  useEffect(() => {
    const bounce = (v: SharedValue<number>, delay: number) => {
      v.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-18, { duration: 400, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) })
          ),
          -1
        )
      );
    };
    bounce(dot1, 0);
    bounce(dot2, 150);
    bounce(dot3, 300);
  }, []);

  useEffect(() => {
    if (surveyAnswers) runPipeline();
  }, [surveyAnswers]);

  const runPipeline = async () => {
    if (!surveyAnswers) return;
    setErrorMsg('');
    try {
      const jobs = csvData.length > 0 ? csvData : await loadCSV();

      // STEP 1
      const uniqueTypes = getUniqueJobTypes(jobs);
      const selectedTypes = await step1SelectJobTypes(
        surveyAnswers.personality,
        surveyAnswers.workplace.map((w) => w.llm),
        uniqueTypes
      );

      // STEP 2 - Client-side filter
      let candidates = filterByJobTypes(jobs, selectedTypes);

      // Region filter
      let regionFiltered = filterByRegion(candidates, surveyAnswers.regions);
      if (regionFiltered.length < 5) {
        regionFiltered = filterBySido(candidates, surveyAnswers.regions);
      }
      if (regionFiltered.length >= 5) {
        candidates = regionFiltered;
      }
      if (candidates.length === 0) {
        candidates = jobs;
      }

      candidates = sampleJobs(candidates, 60);

      // STEP 3
      const scored = await step3ScoreJobs(candidates, surveyAnswers);

      setResults(scored);
      router.replace('/result');
    } catch (e: any) {
      console.error('[Pipeline]', e);
      setErrorMsg('분석 중 오류가 발생했어요. 다시 시도해 주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.title}>AI가 딱 맞는 일자리를{'\n'}찾고 있어요!</Text>

        {/* Bouncing dots animation */}
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, dotStyle1, { backgroundColor: '#43A047' }]} />
          <Animated.View style={[styles.dot, dotStyle2, { backgroundColor: '#26A69A' }]} />
          <Animated.View style={[styles.dot, dotStyle3, { backgroundColor: '#66BB6A' }]} />
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={runPipeline}
              activeOpacity={0.8}
            >
              <Text style={styles.retryBtnText}>다시 시도하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <LoadingTips />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8F5E9' },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 40, paddingHorizontal: 24,
  },
  title: {
    fontSize: 30, fontWeight: '800', color: '#1B5E20',
    textAlign: 'center', lineHeight: 42,
  },
  dotsRow: {
    flexDirection: 'row', gap: 16, alignItems: 'flex-end', height: 60,
  },
  dot: {
    width: 20, height: 20, borderRadius: 10,
  },
  errorBox: { alignItems: 'center', gap: 16 },
  errorText: { fontSize: 22, color: '#C62828', textAlign: 'center', lineHeight: 32 },
  retryBtn: {
    backgroundColor: '#43A047', borderRadius: 20,
    paddingVertical: 16, paddingHorizontal: 36,
  },
  retryBtnText: { fontSize: 22, fontWeight: '700', color: '#fff' },
});
