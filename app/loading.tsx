import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
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
import { step1SelectJobTypes, step1SelectJobTypesByVoice, step3ScoreJobs } from '../utils/llmService';
import { useFontScale } from '../contexts/FontScaleContext';
import { colors, FONT } from '../constants/colors';

export default function LoadingScreen() {
  const router = useRouter();
  const { surveyAnswers, setResults, setRegionNotice, csvData } = useAppContext();
  const { fontScale } = useFontScale();
  const [errorMsg, setErrorMsg] = useState('');

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

    if (surveyAnswers.voiceMode && surveyAnswers.voiceText) {
      await runVoicePipeline();
      return;
    }

    try {
      const jobs = csvData.length > 0 ? csvData : await loadCSV();

      const uniqueTypes = getUniqueJobTypes(jobs);
      const selectedTypes = await step1SelectJobTypes(
        surveyAnswers.personality,
        surveyAnswers.workplace.map((w) => w.llm),
        uniqueTypes
      );

      let candidates = filterByJobTypes(jobs, selectedTypes);

      const exactFiltered = filterByRegion(candidates, surveyAnswers.regions);
      if (exactFiltered.length >= 5) {
        candidates = exactFiltered;
        setRegionNotice(null);
      } else {
        const sidoFiltered = filterBySido(candidates, surveyAnswers.regions);
        if (sidoFiltered.length >= 5) {
          candidates = sidoFiltered;
          const sido = surveyAnswers.regions[0]?.sido ?? '해당 지역';
          setRegionNotice(`해당 지역 공고가 부족하여 '${sido}'에서 검색한 결과입니다.`);
        } else {
          setRegionNotice("해당 지역 공고가 부족하여 '전국'에서 검색한 결과입니다.");
        }
      }

      candidates = sampleJobs(candidates, 60);
      const scored = await step3ScoreJobs(candidates, surveyAnswers);

      setResults(scored);
      router.replace('/result');
    } catch (e: any) {
      console.error('[Pipeline]', e);
      setErrorMsg('분석 중 오류가 발생했어요. 다시 시도해 주세요.');
    }
  };

  const runVoicePipeline = async () => {
    try {
      const jobs = csvData.length > 0 ? csvData : await loadCSV();

      const uniqueTypes = getUniqueJobTypes(jobs);
      const selectedTypes = await step1SelectJobTypesByVoice(
        surveyAnswers!.voiceText!,
        uniqueTypes
      );
      let candidates = filterByJobTypes(jobs, selectedTypes);

      const regions = surveyAnswers!.regions;
      if (regions.length > 0) {
        const exactFiltered = filterByRegion(candidates, regions);
        if (exactFiltered.length >= 5) {
          candidates = exactFiltered;
          setRegionNotice(null);
        } else {
          const sidoFiltered = filterBySido(candidates, regions);
          if (sidoFiltered.length >= 5) {
            candidates = sidoFiltered;
            const sido = regions[0]?.sido ?? '해당 지역';
            setRegionNotice(`해당 지역 공고가 부족하여 '${sido}'에서 검색한 결과입니다.`);
          } else {
            setRegionNotice("해당 지역 공고가 부족하여 '전국'에서 검색한 결과입니다.");
          }
        }
      } else {
        setRegionNotice(null);
      }

      candidates = sampleJobs(candidates, 60);
      const scored = await step3ScoreJobs(candidates, surveyAnswers!);

      setResults(scored);
      router.replace('/result');
    } catch (e: any) {
      console.error('[VoicePipeline]', e);
      setErrorMsg('분석 중 오류가 발생했어요. 다시 시도해 주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <Image
        source={require('../assets/images/flower_bg.png')}
        style={[StyleSheet.absoluteFillObject, styles.flowerBg]}
        resizeMode="cover"
      />
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: 28 * fontScale }]}>
          AI가 딱 맞는 일자리를{'\n'}찾고 있어요!
        </Text>

        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, dotStyle1, { backgroundColor: colors.primary }]} />
          <Animated.View style={[styles.dot, dotStyle2, { backgroundColor: colors.pink }]} />
          <Animated.View style={[styles.dot, dotStyle3, { backgroundColor: colors.primary }]} />
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { fontSize: 22 * fontScale }]}>{errorMsg}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={runPipeline}
              activeOpacity={0.8}
            >
              <Text style={[styles.retryBtnText, { fontSize: 22 * fontScale }]}>다시 시도하기</Text>
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
  safe: { flex: 1, backgroundColor: colors.bg },
  flowerBg: { opacity: 0.06 },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 44, paddingHorizontal: 28,
  },
  title: {
    fontFamily: FONT, color: colors.textDark,
    textAlign: 'center', lineHeight: 42, letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-end', height: 52,
  },
  dot: {
    width: 14, height: 14, borderRadius: 7,
  },
  errorBox: { alignItems: 'center', gap: 16 },
  errorText: { fontFamily: FONT, color: colors.error, textAlign: 'center', lineHeight: 32 },
  retryBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 18, paddingHorizontal: 40,
    shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  retryBtnText: { fontFamily: FONT, color: '#fff' },
});
