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
  const { results, setResults } = useAppContext();
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
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  header: { paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' },
  headerTitle: { fontSize: 30, fontWeight: '800', color: '#1B5E20' },
  headerSub: { fontSize: 19, color: '#66BB6A', marginTop: 4 },
  cardWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  arrowBtn: {
    width: 44, height: 60,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#C8E6C9', borderRadius: 22,
    zIndex: 10,
  },
  arrowLeft: { marginRight: 4 },
  arrowRight: { marginLeft: 4 },
  arrowHidden: { opacity: 0 },
  arrowText: { fontSize: 36, fontWeight: '700', color: '#2E7D32' },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#C8E6C9',
  },
  dotActive: { backgroundColor: '#43A047', width: 28 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 },
  emptyText: { fontSize: 24, color: '#388E3C', textAlign: 'center', lineHeight: 34 },
  homeBtn: {
    backgroundColor: '#43A047', borderRadius: 20,
    paddingVertical: 16, paddingHorizontal: 40,
  },
  homeBtnText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  // Dialog
  dialogOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  dialogBox: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    width: SCREEN_W - 60, alignItems: 'center', gap: 16,
  },
  dialogTitle: { fontSize: 26, fontWeight: '800', color: '#1B5E20' },
  dialogBody: { fontSize: 22, color: '#444', textAlign: 'center', lineHeight: 32 },
  dialogBtns: { flexDirection: 'row', gap: 16, width: '100%' },
  dialogBtn: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  dialogBtnYes: { backgroundColor: '#43A047' },
  dialogBtnNo: { backgroundColor: '#E8F5E9' },
  dialogBtnYesText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  dialogBtnNoText: { fontSize: 22, fontWeight: '700', color: '#2E7D32' },
});
