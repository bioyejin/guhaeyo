import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useAppContext } from './_layout';
import ResultCard from '../components/ResultCard';
import { useFontScale } from '../contexts/FontScaleContext';
import FontScaleButtons from '../components/FontScaleButtons';

const { width: SCREEN_W } = Dimensions.get('window');
const ANIM_DURATION = 500;
const ANIM_EASING = Easing.inOut(Easing.cubic);

export default function ResultScreen() {
  const router = useRouter();
  const { results, setResults, regionNotice, setRegionNotice } = useAppContext();
  const { fontScale } = useFontScale();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [showEndButtons, setShowEndButtons] = useState(false);

  const translateX = useSharedValue(0);
  // busy: Reanimated shared value so the gesture worklet can read it directly
  const busy = useSharedValue(false);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // ── 일반 카드 전환 ───────────────────────────────────────────────────────────
  const animateTo = useCallback((toIndex: number, direction: 'left' | 'right') => {
    if (busy.value) return;
    busy.value = true;
    const outX = direction === 'left' ? -SCREEN_W : SCREEN_W;
    translateX.value = withTiming(outX, { duration: ANIM_DURATION, easing: ANIM_EASING }, (done) => {
      if (done) {
        runOnJS(setCurrentIndex)(toIndex);
        translateX.value = -outX;
        translateX.value = withTiming(0, { duration: ANIM_DURATION, easing: ANIM_EASING }, (d2) => {
          if (d2) { busy.value = false; }
        });
      }
    });
  }, []);

  // ── 마지막 카드 → 빈 화면으로 슬라이드 오프 ──────────────────────────────────
  const handleGoToEnd = useCallback(() => {
    if (busy.value) return;
    busy.value = true;
    translateX.value = withTiming(-SCREEN_W, { duration: ANIM_DURATION, easing: ANIM_EASING }, (done) => {
      if (done) {
        runOnJS(setShowEndButtons)(true);
        // busy stays true until the user returns
      }
    });
  }, []);

  // ── 팝업 닫고 마지막 카드로 돌아오기 ──────────────────────────────────────────
  const handleReturnFromEnd = useCallback(() => {
    setShowEndButtons(false);
    // translateX is at -SCREEN_W; animate card back in
    translateX.value = withTiming(0, { duration: ANIM_DURATION, easing: ANIM_EASING }, (done) => {
      if (done) { busy.value = false; }
    });
  }, []);

  // ── 다시 찾기 다이얼로그 닫고 마지막 카드로 슬라이드 복귀 ──────────────────
  const handleReturnFromDialog = useCallback(() => {
    setShowDialog(false);
    translateX.value = withTiming(0, { duration: ANIM_DURATION, easing: ANIM_EASING }, (done) => {
      if (done) { busy.value = false; }
    });
  }, []);

  // ── 다음/이전 ────────────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!results || busy.value) return;
    if (currentIndex < results.length - 1) {
      animateTo(currentIndex + 1, 'left');
    } else {
      handleGoToEnd();
    }
  }, [results, currentIndex, animateTo, handleGoToEnd]);

  const handlePrev = useCallback(() => {
    if (busy.value || currentIndex === 0) return;
    animateTo(currentIndex - 1, 'right');
  }, [currentIndex, animateTo]);

  // ── 스와이프 제스처 (GestureDetector + Gesture.Pan) ──────────────────────────
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-30, 30])
    .onEnd((e) => {
      if (busy.value) return;
      if (e.translationX < -50) runOnJS(handleNext)();
      else if (e.translationX > 50) runOnJS(handlePrev)();
    });

  const handleGoHome = useCallback(() => {
    setResults(null);
    setRegionNotice(null);
    router.replace('/home');
  }, []);

  // ── 빈 결과 ─────────────────────────────────────────────────────────────────
  if (!results || results.length === 0) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { fontSize: 24 * fontScale }]}>
              결과를 찾을 수 없어요.{'\n'}다시 시도해 주세요.
            </Text>
            <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/home')}>
              <Text style={[styles.homeBtnText, { fontSize: 22 * fontScale }]}>처음으로</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const job = results[currentIndex];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontSize: 24 * fontScale }]}>추천 일자리</Text>
          <Text style={[styles.headerSub, { fontSize: 15 * fontScale }]}>나에게 딱 맞는 공고를 찾았어요!</Text>
        </View>

        {/* Region notice banner */}
        {regionNotice && (
          <View style={styles.noticeBanner}>
            <Text style={[styles.noticeText, { fontSize: 14 * fontScale }]}>{regionNotice}</Text>
          </View>
        )}

        {/* Card with gesture */}
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.cardWrapper}>
            {/* Left arrow */}
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowLeft, currentIndex === 0 && styles.arrowHidden]}
              onPress={handlePrev}
              activeOpacity={0.7}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            <Animated.View style={[styles.cardContainer, cardStyle]}>
              <ResultCard key={currentIndex} job={job} />
            </Animated.View>

            {/* Right arrow */}
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowRight]}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
        </GestureDetector>

        {/* Dot indicator */}
        <View style={styles.dotsRow}>
          {results.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        {/* 마지막 카드 이후 팝업: 배경 탭 → 카드로 돌아오기 */}
        {showEndButtons && (
          <TouchableOpacity
            style={styles.dialogOverlay}
            activeOpacity={1}
            onPress={handleReturnFromEnd}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.endButtonsBox}>
                <Text style={[styles.endButtonsTitle, { fontSize: 22 * fontScale }]}>
                  더 보고 싶으신가요?
                </Text>
                <TouchableOpacity
                  style={[styles.endBtn, styles.endBtnPrimary]}
                  onPress={() => {
                    setShowEndButtons(false);
                    translateX.value = 0;
                    busy.value = false;
                    router.push('/more-jobs');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.endBtnPrimaryText, { fontSize: 20 * fontScale }]}>
                    내 지역 공고 더보기
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.endBtn, styles.endBtnSecondary]}
                  onPress={() => {
                    setShowEndButtons(false);
                    setShowDialog(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.endBtnSecondaryText, { fontSize: 20 * fontScale }]}>
                    다시 찾아보기
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* 다시 찾기 dialog */}
        {showDialog && (
          <TouchableOpacity
            style={styles.dialogOverlay}
            activeOpacity={1}
            onPress={handleReturnFromDialog}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.dialogBox}>
                <Text style={[styles.dialogTitle, { fontSize: 24 * fontScale }]}>다시 찾아볼까요?</Text>
                <Text style={[styles.dialogBody, { fontSize: 20 * fontScale }]}>
                  다시 돌아가면 결과가 사라집니다.{'\n'}문항을 다시 선택하시겠어요?
                </Text>
                <View style={styles.dialogBtns}>
                  <TouchableOpacity
                    style={[styles.dialogBtn, styles.dialogBtnYes]}
                    onPress={handleGoHome}
                  >
                    <Text style={[styles.dialogBtnYesText, { fontSize: 22 * fontScale }]}>예</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dialogBtn, styles.dialogBtnNo]}
                    onPress={handleReturnFromDialog}
                  >
                    <Text style={[styles.dialogBtnNoText, { fontSize: 22 * fontScale }]}>아니오</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* FontScale 버튼: 팝업 노출 시 숨김 */}
      {!showEndButtons && !showDialog && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <FontScaleButtons topOffset={4} small />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFF' },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 14,
    alignItems: 'center',
  },
  headerTitle: { fontWeight: '700', color: '#0D1B3E', letterSpacing: 0.2 },
  headerSub: { color: '#2060E0', marginTop: 5 },
  noticeBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#FFF7EC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  noticeText: { color: '#8B5E00', textAlign: 'center', lineHeight: 20 },
  cardWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  arrowBtn: {
    width: 38, height: 60,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#EBF2FF', borderRadius: 8,
    zIndex: 10,
  },
  arrowLeft: { marginRight: 2 },
  arrowRight: { marginLeft: 2 },
  arrowHidden: { opacity: 0 },
  arrowText: { fontSize: 32, fontWeight: '600', color: '#2060E0' },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 6, paddingVertical: 18, paddingBottom: 24,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#C8D4F0' },
  dotActive: { backgroundColor: '#2060E0', width: 22, borderRadius: 3.5 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 },
  emptyText: { color: '#2C3550', textAlign: 'center', lineHeight: 34 },
  homeBtn: {
    backgroundColor: '#2060E0', borderRadius: 10,
    paddingVertical: 18, paddingHorizontal: 44,
    shadowColor: '#2060E0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  homeBtnText: { fontWeight: '700', color: '#fff' },
  dialogOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  endButtonsBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    width: SCREEN_W - 52, alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  endButtonsTitle: { fontWeight: '700', color: '#0D1B3E', marginBottom: 4 },
  endBtn: { width: '100%', borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  endBtnPrimary: {
    backgroundColor: '#2060E0',
    shadowColor: '#2060E0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  endBtnPrimaryText: { fontWeight: '700', color: '#fff' },
  endBtnSecondary: { backgroundColor: '#EBF2FF' },
  endBtnSecondaryText: { fontWeight: '700', color: '#2060E0' },
  dialogBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 30,
    width: SCREEN_W - 52, alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  dialogTitle: { fontWeight: '700', color: '#0D1B3E' },
  dialogBody: { color: '#4A5568', textAlign: 'center', lineHeight: 30 },
  dialogBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  dialogBtn: { flex: 1, borderRadius: 10, paddingVertical: 17, alignItems: 'center' },
  dialogBtnYes: { backgroundColor: '#2060E0' },
  dialogBtnNo: { backgroundColor: '#EBF2FF' },
  dialogBtnYesText: { fontWeight: '700', color: '#fff' },
  dialogBtnNoText: { fontWeight: '700', color: '#2060E0' },
});
