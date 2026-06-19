/**
 * voice.tsx
 *
 * @react-native-voice/voice는 모듈 평가 시점(module evaluation time)에
 * Platform.OS를 즉시 참조하고, 이것이 TurboModuleRegistry.getEnforcing('PlatformConstants')를
 * 호출한다. expo-router가 라우트 트리를 구성할 때 이 파일을 평가하는데,
 * 그 시점에는 React Native 런타임이 완전히 준비되지 않아 "[runtime not ready]" 에러가 발생한다.
 *
 * 해결책: require('@react-native-voice/voice')를 파일 최상위에서 완전히 제거하고
 * useEffect 안에서만 실행한다. useEffect는 컴포넌트 마운트 이후에 실행되므로
 * React Native 런타임이 반드시 준비된 상태가 보장된다.
 *
 * 웹 환경: Platform.OS === 'web'일 때 Web Speech API (SpeechRecognition)를 사용한다.
 * 네이티브 앱(Expo Go)에서는 기존 @react-native-voice/voice 방식 그대로 동작한다.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  NativeModules,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { useAppContext } from '../_layout';
import { SIDO_LIST, SIGUNGU_MAP } from '../../constants/surveyData';
import type { Region } from '../../utils/types';
import { useFontScale } from '../../contexts/FontScaleContext';

// ── 지역 파싱 ─────────────────────────────────────────────────────────────────
function parseRegionFromText(text: string): Region | null {
  const sido = SIDO_LIST.find((s) =>
    text.includes(
      s.replace('특별시', '')
        .replace('광역시', '')
        .replace('특별자치도', '')
        .replace('도', '')
        .slice(0, 2)
    )
  );
  if (!sido) return null;
  const sigunguList = SIGUNGU_MAP[sido] ?? [];
  const sigungu = sigunguList.find((sg) => text.includes(sg)) ?? '';
  return { sido, sigungu };
}

// ── Web Speech API 어댑터 (웹 전용) ───────────────────────────────────────────
// 네이티브 @react-native-voice/voice와 동일한 인터페이스를 제공해서
// VoiceSurveyInner가 플랫폼을 신경 쓰지 않아도 된다.
class WebSpeechAdapter {
  private _rec: any = null;
  private _stopping = false;
  onSpeechResults: ((e: { value: string[] }) => void) | null = null;
  onSpeechError: ((e: any) => void) | null = null;

  static isAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
    );
  }

  async start(locale: string) {
    const SR =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    this._stopping = false;
    const r = new SR();
    r.lang = locale;
    r.interimResults = true;  // 중간 결과 실시간 표시
    r.continuous = true;      // 수동으로 stop() 호출 시까지 계속 인식
    r.onresult = (e: any) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      this.onSpeechResults?.({ value: [text] });
    };
    r.onerror = (e: any) => {
      this._stopping = false;
      this.onSpeechError?.(e);
    };
    r.onend = () => {
      // _stopping이 false면 예기치 않은 종료 → 녹음 상태 초기화
      if (!this._stopping) {
        this.onSpeechError?.({ error: 'ended' });
      }
      this._stopping = false;
    };
    this._rec = r;
    r.start();
  }

  async stop() {
    this._stopping = true;
    this._rec?.stop();
  }

  async destroy() {
    this._stopping = true;
    this._rec?.abort();
    this._rec = null;
  }
}

// ── 타입 ─────────────────────────────────────────────────────────────────────
type VoiceState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; module: any };

// ── 루트 컴포넌트 ─────────────────────────────────────────────────────────────
export default function VoiceSurvey() {
  const [voiceState, setVoiceState] = useState<VoiceState>({ status: 'loading' });

  useEffect(() => {
    if (Platform.OS === 'web') {
      // 웹: Web Speech API (SpeechRecognition) 사용
      if (WebSpeechAdapter.isAvailable()) {
        setVoiceState({ status: 'ready', module: new WebSpeechAdapter() });
      } else {
        setVoiceState({ status: 'unavailable' });
      }
      return;
    }

    // 네이티브: @react-native-voice/voice 사용 (기존 로직 유지)
    // useEffect는 마운트 이후 실행 → React Native 런타임이 반드시 준비된 상태
    if (!NativeModules.Voice) {
      setVoiceState({ status: 'unavailable' });
      return;
    }
    try {
      const VoiceModule = require('@react-native-voice/voice').default;
      setVoiceState({ status: 'ready', module: VoiceModule });
    } catch {
      setVoiceState({ status: 'unavailable' });
    }
  }, []);

  if (voiceState.status === 'loading') {
    return <SafeAreaView style={styles.safe} />;
  }

  if (voiceState.status === 'unavailable') {
    return <UnavailableFallback />;
  }

  return <VoiceSurveyInner voiceModule={voiceState.module} />;
}

// ── 음성 인식 불가 안내 화면 ──────────────────────────────────────────────────
function UnavailableFallback() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeIn.duration(600)} style={styles.fallbackContainer}>
        <Text style={styles.fallbackTitle}>음성 기능을 사용할 수 없어요</Text>
        <View style={styles.fallbackCard}>
          {isWeb ? (
            <Text style={styles.fallbackBody}>
              이 브라우저에서{'\n'}
              음성 인식을 지원하지 않아요.{'\n'}
              <Text style={styles.fallbackBold}>크롬(Chrome) 브라우저</Text>를{'\n'}
              사용해 주세요.
            </Text>
          ) : (
            <>
              <Text style={styles.fallbackBody}>
                음성 인식은 네이티브 모듈이 포함된{'\n'}
                <Text style={styles.fallbackBold}>개발 빌드(Dev Build)</Text>에서만{'\n'}
                사용할 수 있어요.
              </Text>
              <Text style={styles.fallbackBody2}>
                Expo Go에서는 텍스트 입력 방식으로{'\n'}
                동일하게 일자리를 찾을 수 있습니다.
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.fallbackBtn}
          onPress={() => router.replace('/survey/text')}
          activeOpacity={0.85}
        >
          <Text style={styles.fallbackBtnText}>텍스트로 찾기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fallbackBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.fallbackBackBtnText}>← 홈으로 돌아가기</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ── 2단계 음성 설문 ────────────────────────────────────────────────────────────
function VoiceSurveyInner({ voiceModule }: { voiceModule: any }) {
  const router = useRouter();
  const { setSurveyAnswers } = useAppContext();
  const { fontScale } = useFontScale();

  const [stage, setStage] = useState<0 | 1>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [regionError, setRegionError] = useState('');
  const [savedRegionText, setSavedRegionText] = useState('');

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const micScale = useAnimatedStyle(() => ({
    transform: [{ scale: isRecording ? 0.85 + (pulseScale.value - 1) * 0.5 : 1 }],
  }));

  // 녹음 상태에 따른 pulse 애니메이션
  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 700, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 700, easing: Easing.in(Easing.ease) })
        ),
        -1
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 700 }),
          withTiming(0.1, { duration: 700 })
        ),
        -1
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isRecording]);

  // Voice 이벤트 리스너 등록
  useEffect(() => {
    voiceModule.onSpeechResults = (e: any) => {
      setTranscript(e.value?.[0] ?? '');
    };
    voiceModule.onSpeechError = (e: any) => {
      console.warn('[Voice]', e);
      setIsRecording(false);
    };
    return () => {
      voiceModule?.destroy?.().catch(() => {});
    };
  }, [voiceModule]);

  // 단계 전환 시 transcript 초기화
  useEffect(() => {
    setTranscript('');
    setIsRecording(false);
  }, [stage]);

  const handleMicPress = async () => {
    if (isRecording) {
      try { await voiceModule.stop(); } catch {}
      setIsRecording(false);
    } else {
      setTranscript('');
      setRegionError('');
      try {
        await voiceModule.start('ko-KR');
        setIsRecording(true);
      } catch {
        Alert.alert('오류', '마이크를 시작할 수 없습니다. 권한을 확인해 주세요.');
      }
    }
  };

  const handleNextFromStage0 = () => {
    if (!transcript.trim()) return;
    const region = parseRegionFromText(transcript);
    if (!region) {
      setRegionError('지역을 이해하지 못했어요.\n도/광역시 이름도 함께 말씀해 주세요.\n예) 경기도 수원시, 서울 강남구');
      return;
    }
    setSavedRegionText(transcript);
    setRegionError('');
    setStage(1);
  };

  const handleSubmit = () => {
    if (!transcript.trim()) return;

    // 1단계에서 저장한 지역 파싱
    const region = parseRegionFromText(savedRegionText);
    const regions: Region[] = region ? [region] : [];

    setSurveyAnswers({
      regions,
      personality: [],
      workplace: [],
      activityLevel: '',
      environment: '',
      workDays: '',
      certifications: [],
      voiceMode: true,
      voiceText: transcript.trim(),
    });

    router.push('/loading');
  };

  if (stage === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.stageContainer}>
          {/* 타이틀 */}
          <View style={styles.titleArea}>
            <Text style={[styles.stageTitle, { fontSize: 26 * fontScale }]}>
              근무하고 싶은 지역을{'\n'}말씀해 주세요
            </Text>
            <Text style={[styles.stageExample, { fontSize: 17 * fontScale }]}>
              예) 경기도 고양시, 서울 강남구
            </Text>
          </View>

          {/* 마이크 버튼 */}
          <View style={styles.micArea}>
            <Animated.View style={[styles.pulseRing, pulseStyle]} />
            <Animated.View style={micScale}>
              <TouchableOpacity
                style={[styles.micBtn, isRecording && styles.micBtnActive]}
                onPress={handleMicPress}
                activeOpacity={0.8}
              >
                <Text style={styles.micIcon}>{isRecording ? '■' : '🎤'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* 인식된 텍스트 */}
          {transcript ? (
            <View style={styles.transcriptBox}>
              <Text style={[styles.transcriptText, { fontSize: 19 * fontScale }]}>
                "{transcript}"
              </Text>
            </View>
          ) : null}

          {/* 오류 메시지 */}
          {regionError ? (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { fontSize: 15 * fontScale }]}>{regionError}</Text>
            </View>
          ) : null}

          {/* 안내 문구 */}
          <View style={styles.guideWrap}>
            <Text style={[styles.guideText, { fontSize: 17 * fontScale }]}>
              버튼을 눌러 지역을 말씀해 주세요
            </Text>
            <Text style={[styles.guideText, { fontSize: 17 * fontScale }]}>
              말씀이 끝나면 버튼을 다시 눌러주세요
            </Text>
          </View>

          {/* 다음 버튼 */}
          <TouchableOpacity
            style={[
              styles.nextBtn,
              (!transcript.trim() || isRecording) && styles.nextBtnDisabled,
            ]}
            onPress={handleNextFromStage0}
            disabled={!transcript.trim() || isRecording}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextBtnText, { fontSize: 20 * fontScale }]}>
              다음
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Stage 1 — 자유 발화
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.stageContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 타이틀 */}
        <View style={styles.titleArea}>
          <Text style={[styles.stageTitle, { fontSize: 26 * fontScale }]}>
            이렇게 말씀해 보세요
          </Text>
        </View>

        {/* 예시 문항 리스트 */}
        <View style={styles.exampleList}>
          {[
            '어떤 일을 해보셨나요?',
            '성격이 어떠신가요?',
            '주에 며칠 일하고 싶으세요?',
            '원하는 근무 환경이 있으신가요?',
            '아프거나 불편한 곳이 있으신가요?',
            '보유하신 자격증이 있으신가요?',
          ].map((q, i) => (
            <View key={i} style={styles.exampleItem}>
              <Text style={[styles.exampleBullet, { fontSize: 16 * fontScale }]}>•</Text>
              <Text style={[styles.exampleText, { fontSize: 16 * fontScale }]}>{q}</Text>
            </View>
          ))}
        </View>

        {/* 마이크 버튼 */}
        <View style={styles.micArea}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <Animated.View style={micScale}>
            <TouchableOpacity
              style={[styles.micBtn, isRecording && styles.micBtnActive]}
              onPress={handleMicPress}
              activeOpacity={0.8}
            >
              <Text style={styles.micIcon}>{isRecording ? '■' : '🎤'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* 인식된 텍스트 */}
        {transcript ? (
          <View style={styles.transcriptBox}>
            <Text style={[styles.transcriptText, { fontSize: 19 * fontScale }]}>
              "{transcript}"
            </Text>
          </View>
        ) : null}

        {/* 안내 문구 */}
        <View style={styles.guideWrap}>
          <Text style={[styles.guideText, { fontSize: 17 * fontScale }]}>
            버튼을 눌러 자유롭게 말씀해 주세요
          </Text>
          <Text style={[styles.guideText, { fontSize: 17 * fontScale }]}>
            말씀이 끝나면 버튼을 다시 눌러주세요
          </Text>
        </View>

        {/* 결과 검색 버튼 */}
        <TouchableOpacity
          style={[
            styles.nextBtn,
            styles.submitBtn,
            (!transcript.trim() || isRecording) && styles.nextBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!transcript.trim() || isRecording}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, { fontSize: 20 * fontScale }]}>
            결과 검색하기
          </Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },

  // UnavailableFallback
  fallbackContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, gap: 24,
  },
  fallbackTitle: {
    fontSize: 26, fontWeight: '700', color: '#0D1B3E', textAlign: 'center',
  },
  fallbackCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24,
    width: '100%', gap: 14, borderWidth: 1.5, borderColor: '#E2E8F5',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  fallbackBody: { fontSize: 22, color: '#2C3550', textAlign: 'center', lineHeight: 34 },
  fallbackBold: { fontWeight: '700', color: '#2060E0' },
  fallbackBody2: { fontSize: 20, color: '#6B7A99', textAlign: 'center', lineHeight: 30 },
  fallbackBtn: {
    backgroundColor: '#2060E0', borderRadius: 10, paddingVertical: 20,
    paddingHorizontal: 40, width: '100%', alignItems: 'center',
    shadowColor: '#2060E0', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  fallbackBtnText: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  fallbackBackBtn: { paddingVertical: 12 },
  fallbackBackBtnText: { fontSize: 20, color: '#5B9FFF', fontWeight: '600' },

  // 2단계 공통
  stageContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 105,
    paddingBottom: 16,
    gap: 20,
  },
  titleArea: { alignItems: 'center', gap: 10, width: '100%' },
  stageTitle: {
    fontWeight: '700',
    color: '#0D1B3E',
    textAlign: 'center',
    lineHeight: 38,
  },
  stageExample: {
    color: '#2060E0',
    textAlign: 'center',
    fontWeight: '500',
  },

  // 예시 문항 리스트
  exampleList: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  exampleBullet: {
    color: '#2060E0',
    fontWeight: '700',
    lineHeight: 24,
  },
  exampleText: {
    color: '#2C3550',
    lineHeight: 24,
    flex: 1,
  },

  // 마이크 영역
  micArea: {
    width: 180, height: 180,
    alignItems: 'center', justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#2060E0',
  },
  micBtn: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: '#2060E0',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2060E0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  micBtnActive: { backgroundColor: '#D03020' },
  micIcon: { fontSize: 44, color: '#FFFFFF' },

  // 인식 텍스트 박스
  transcriptBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 16,
    borderWidth: 1.5, borderColor: '#D4DCF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  transcriptText: {
    color: '#2C3550',
    textAlign: 'center',
    lineHeight: 28,
  },

  // 오류 박스
  errorBox: {
    width: '100%',
    backgroundColor: '#FFF0F0',
    borderRadius: 10, padding: 14,
    borderWidth: 1.5, borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
    lineHeight: 22,
  },

  // 안내 문구
  guideWrap: { alignItems: 'center', gap: 6 },
  guideText: {
    color: '#6B7A99',
    textAlign: 'center',
  },

  // 다음/검색 버튼
  nextBtn: {
    width: '100%',
    backgroundColor: '#2060E0',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#2060E0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  submitBtn: {
    backgroundColor: '#0D4BBF',
  },
  nextBtnDisabled: {
    backgroundColor: '#B0BDD8',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
