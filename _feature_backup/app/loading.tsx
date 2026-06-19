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
  const { surveyAnswers, setResults, setRegionNotice, csvData } = useAppContext();
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

      // Region filter — 3-tier with explicit notice
      const exactFiltered = filterByRegion(candidates, surveyAnswers.regions);
      if (exactFiltered.length >= 5) {
        candidates = exactFiltered;
        setRegionNotice(null);
      } else {
        const sidoFiltered = filterBySido(candidates, surveyAnswers.regions);
        if (sidoFiltered.length >= 5) {
          candidates = sidoFiltered;
          const sido = surveyAnswers.regions[0]?.sido ?? '해당 지역';
          setRegionNotice(`${sido} 전체에서 검색한 결과입니다.`);
        } else {
          // double fallback — keep nationwide job-type filtered
          setRegionNotice('해당 지역 공고가 부족하여 전국에서 검색한 결과입니다.');
        }
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
          <Animated.View style={[styles.dot, dotStyle1, { backgroundColor: '#2060E0' }]} />
          <Animated.View style={[styles.dot, dotStyle2, { backgroundColor: '#5B9FFF' }]} />
          <Animated.View style={[styles.dot, dotStyle3, { backgroundColor: '#2060E0' }]} />
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
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 44, paddingHorizontal: 28,
  },
  title: {
    fontSize: 28, fontWeight: '700', color: '#0D1B3E',
    textAlign: 'center', lineHeight: 42, letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-end', height: 52,
  },
  dot: {
    width: 14, height: 14, borderRadius: 7,
  },
  errorBox: { alignItems: 'center', gap: 16 },
  errorText: { fontSize: 22, color: '#C62828', textAlign: 'center', lineHeight: 32 },
  retryBtn: {
    backgroundColor: '#2060E0', borderRadius: 10,
    paddingVertical: 18, paddingHorizontal: 40,
    shadowColor: '#2060E0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  retryBtnText: { fontSize: 22, fontWeight: '700', color: '#fff' },
});
