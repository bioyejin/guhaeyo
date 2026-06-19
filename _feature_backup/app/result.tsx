import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useAppContext } from './_layout';
import ResultCard from '../components/ResultCard';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;

export default function ResultScreen() {
  const router = useRouter();
  const { results, setResults, regionNotice, setRegionNotice } = useAppContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDialog, setShowDialog] = useState(false);

  const translateX = useSharedValue(0);
  const isAnimating = useRef(false);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animateTo = (toIndex: number, direction: 'left' | 'right') => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const outX = direction === 'left' ? -SCREEN_W : SCREEN_W;

    translateX.value = withTiming(
      outX,
      { duration: 500, easing: Easing.inOut(Easing.cubic) },
      (done) => {
        if (done) {
          runOnJS(setCurrentIndex)(toIndex);
          translateX.value = -outX;
          translateX.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.cubic) }, (d2) => {
            if (d2) runOnJS(setIsAnimatingFalse)();
          });
        }
      }
    );
  };

  const setIsAnimatingFalse = () => { isAnimating.current = false; };

  const handleNext = () => {
    if (!results) return;
    if (currentIndex < results.length - 1) {
      animateTo(currentIndex + 1, 'left');
    } else {
      setShowDialog(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      animateTo(currentIndex - 1, 'right');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dy) < 60,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) handleNext();
        else if (g.dx > 50) handlePrev();
      },
    })
  ).current;

  const handleGoHome = () => {
    setResults(null);
    setRegionNotice(null);
    router.replace('/home');
  };

  if (!results || results.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>결과를 찾을 수 없어요.{'\n'}다시 시도해 주세요.</Text>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/home')}>
            <Text style={styles.homeBtnText}>처음으로</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const job = results[currentIndex];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>추천 일자리</Text>
        <Text style={styles.headerSub}>나에게 딱 맞는 공고를 찾았어요!</Text>
      </View>

      {/* Region notice banner */}
      {regionNotice && (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>{regionNotice}</Text>
        </View>
      )}

      {/* Card with gesture */}
      <View style={styles.cardWrapper} {...panResponder.panHandlers}>
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
          <Text style={styles.arrowText}>
            {currentIndex < results.length - 1 ? '›' : '↺'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dot indicator */}
      <View style={styles.dotsRow}>
        {results.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* Exit dialog */}
      {showDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>다시 찾아볼까요?</Text>
            <Text style={styles.dialogBody}>
              다시 돌아가면 결과가 사라집니다.{'\n'}문항을 다시 선택하시겠어요?
            </Text>
            <View style={styles.dialogBtns}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnYes]}
                onPress={handleGoHome}
              >
                <Text style={styles.dialogBtnYesText}>예</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnNo]}
                onPress={() => setShowDialog(false)}
              >
                <Text style={styles.dialogBtnNoText}>아니오</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#0D1B3E', letterSpacing: 0.2 },
  headerSub: { fontSize: 15, color: '#2060E0', marginTop: 5 },
  noticeBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#FFF7EC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  noticeText: {
    fontSize: 14,
    color: '#8B5E00',
    textAlign: 'center',
    lineHeight: 20,
  },
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
    gap: 6, paddingVertical: 20, paddingBottom: 28,
  },
  dot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#C8D4F0',
  },
  dotActive: { backgroundColor: '#2060E0', width: 22, borderRadius: 3.5 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 },
  emptyText: { fontSize: 24, color: '#2C3550', textAlign: 'center', lineHeight: 34 },
  homeBtn: {
    backgroundColor: '#2060E0', borderRadius: 10,
    paddingVertical: 18, paddingHorizontal: 44,
    shadowColor: '#2060E0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  homeBtnText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  // Dialog
  dialogOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  dialogBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 30,
    width: SCREEN_W - 52, alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  dialogTitle: { fontSize: 24, fontWeight: '700', color: '#0D1B3E' },
  dialogBody: { fontSize: 20, color: '#4A5568', textAlign: 'center', lineHeight: 30 },
  dialogBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  dialogBtn: { flex: 1, borderRadius: 10, paddingVertical: 17, alignItems: 'center' },
  dialogBtnYes: { backgroundColor: '#2060E0' },
  dialogBtnNo: { backgroundColor: '#EBF2FF' },
  dialogBtnYesText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  dialogBtnNoText: { fontSize: 22, fontWeight: '700', color: '#2060E0' },
});
