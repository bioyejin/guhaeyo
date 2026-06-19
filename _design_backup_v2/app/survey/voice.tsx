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
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
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
import ProgressBar from '../../components/ProgressBar';
import { useAppContext } from '../_layout';
import {
  PERSONALITY_OPTIONS,
  WORKPLACE_OPTIONS,
  ACTIVITY_OPTIONS,
  ENVIRONMENT_OPTIONS,
  WORKDAYS_OPTIONS,
  CERTIFICATION_OPTIONS,
  SIDO_LIST,
} from '../../constants/surveyData';
import type { Region, WorkplaceOption } from '../../utils/types';

// ── @react-native-voice/voice는 이 파일 최상위에서 require하지 않는다 ──────────
// (이유는 파일 상단 주석 참고)

const VOICE_QUESTIONS = [
  '어느 지역에서 일하고 싶으세요? 예를 들어 서울 강남구처럼 말씀해 주세요.',
  '나와 가장 잘 맞는 성격은 무엇인가요? 친절하고 사람을 좋아해요, 꼼꼼해요, 성실하고 책임감 있어요, 창의적이에요, 자연을 좋아해요 중에서 말씀해 주세요.',
  '가장 끌리는 일터 장면을 말씀해 주세요. 보육 돌봄, 동네 관리 및 청소, 가게 운영, 음식 만들기, 식물 가꾸기, 행사 및 문화 돕기, 서류 정리, 교육 및 상담, 카페 및 바리스타 중에서 선택해 주세요.',
  '하루에 감당할 수 있는 활동량은 어느 정도인가요? 주로 앉아서, 가볍게 걷기, 야외 활동 가능 중에서 말씀해 주세요.',
  '선호하시는 일터 환경은 어디인가요? 실내, 실외, 상관없음 중에서 말씀해 주세요.',
  '일주일에 몇 일 정도 근무하기를 희망하시나요? 짧게 1에서 3일, 4에서 5일, 상관없음 중에서 말씀해 주세요.',
  '보유 중인 자격증이 있다면 말씀해 주세요. 사회복지사 자격증, 요양보호사 자격증, 없음 중에서 말씀해 주세요.',
];

const TOTAL_STEPS = 7;

function parseVoiceAnswer(step: number, text: string) {
  const t = text.toLowerCase();
  switch (step) {
    case 0: {
      const region = parseRegionFromText(text);
      return region ? [region] : [{ sido: text, sigungu: '' }];
    }
    case 1: {
      const matched = PERSONALITY_OPTIONS.filter((o) =>
        t.includes(o.replace('해요', '').replace('있어요', ''))
      );
      return matched.length > 0 ? matched.slice(0, 2) : [PERSONALITY_OPTIONS[0]];
    }
    case 2: {
      const matched = WORKPLACE_OPTIONS.filter((o) =>
        t.includes(o.display.replace(',', '').replace(' ', ''))
      );
      return matched.length > 0 ? matched.slice(0, 2) : [WORKPLACE_OPTIONS[0]];
    }
    case 3:
      if (t.includes('앉')) return ACTIVITY_OPTIONS[0];
      if (t.includes('걷')) return ACTIVITY_OPTIONS[1];
      return ACTIVITY_OPTIONS[2];
    case 4:
      if (t.includes('실내')) return ENVIRONMENT_OPTIONS[0];
      if (t.includes('실외') || t.includes('야외')) return ENVIRONMENT_OPTIONS[1];
      return ENVIRONMENT_OPTIONS[2];
    case 5:
      if (t.includes('짧') || t.includes('1') || t.includes('2') || t.includes('3'))
        return WORKDAYS_OPTIONS[0];
      if (t.includes('4') || t.includes('5')) return WORKDAYS_OPTIONS[1];
      return WORKDAYS_OPTIONS[2];
    case 6: {
      const certs: string[] = [];
      if (t.includes('사회복지')) certs.push(CERTIFICATION_OPTIONS[0]);
      if (t.includes('요양')) certs.push(CERTIFICATION_OPTIONS[1]);
      if (certs.length === 0) certs.push('없음');
      return certs;
    }
    default:
      return text;
  }
}

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
  return sido ? { sido, sigungu: '' } : null;
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
    // useEffect는 마운트 이후 실행 → React Native 런타임이 반드시 준비된 상태
    // 여기서 require하면 Platform.OS 접근이 안전하게 이루어진다.

    // 1. NativeModules.Voice 존재 여부로 네이티브 모듈 등록 확인
    if (!NativeModules.Voice) {
      setVoiceState({ status: 'unavailable' });
      return;
    }

    // 2. 네이티브 모듈이 있을 때만 JS 모듈 로드
    try {
      const VoiceModule = require('@react-native-voice/voice').default;
      setVoiceState({ status: 'ready', module: VoiceModule });
    } catch {
      setVoiceState({ status: 'unavailable' });
    }
  }, []);

  if (voiceState.status === 'loading') {
    // 마운트 직후 순식간에 전환되므로 빈 화면으로 처리
    return <SafeAreaView style={styles.safe} />;
  }

  if (voiceState.status === 'unavailable') {
    return <ExpoGoFallback />;
  }

  return <VoiceSurveyInner voiceModule={voiceState.module} />;
}

// ── Expo Go / 네이티브 모듈 없음 안내 화면 ────────────────────────────────────
function ExpoGoFallback() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeIn.duration(600)} style={styles.fallbackContainer}>
        <Text style={styles.fallbackIcon}>🎤</Text>
        <Text style={styles.fallbackTitle}>음성 기능을 사용할 수 없어요</Text>
        <View style={styles.fallbackCard}>
          <Text style={styles.fallbackBody}>
            음성 인식은 네이티브 모듈이 포함된{'\n'}
            <Text style={styles.fallbackBold}>개발 빌드(Dev Build)</Text>에서만{'\n'}
            사용할 수 있어요.
          </Text>
          <Text style={styles.fallbackBody2}>
            Expo Go에서는 텍스트 입력 방식으로{'\n'}
            동일하게 일자리를 찾을 수 있습니다.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.fallbackBtn}
          onPress={() => router.replace('/survey/text')}
          activeOpacity={0.85}
        >
          <Text style={styles.fallbackBtnText}>✍️  텍스트로 찾기</Text>
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

// ── 실제 음성 설문 (네이티브 모듈이 있을 때만 렌더링) ────────────────────────
function VoiceSurveyInner({ voiceModule }: { voiceModule: any }) {
  const router = useRouter();
  const { setSurveyAnswers } = useAppContext();
  const [step, setStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const answers = useRef<any[]>(new Array(TOTAL_STEPS).fill(null));

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isRecording ? pulseScale.value * 0.85 : 1 }],
  }));

  // 녹음 상태에 따른 파동 애니메이션
  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 600, easing: Easing.in(Easing.ease) })
        ),
        -1
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600 }),
          withTiming(0.6, { duration: 600 })
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

  // 문항 변경 시 TTS 읽기
  useEffect(() => {
    speakQuestion(step);
    return () => { Speech.stop(); };
  }, [step]);

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

  const speakQuestion = (s: number) => {
    Speech.speak(VOICE_QUESTIONS[s], { language: 'ko-KR', rate: 0.85 });
  };

  const handleMicPress = async () => {
    if (isRecording) {
      try { await voiceModule.stop(); } catch {}
      setIsRecording(false);

      const parsed = parseVoiceAnswer(step, transcript);
      answers.current[step] = parsed;
      setTranscript('');

      if (step < TOTAL_STEPS - 1) {
        setStep((s) => s + 1);
      } else {
        finishSurvey();
      }
    } else {
      Speech.stop();
      setTranscript('');
      try {
        await voiceModule.start('ko-KR');
        setIsRecording(true);
      } catch {
        Alert.alert('오류', '마이크를 시작할 수 없습니다. 권한을 확인해 주세요.');
      }
    }
  };

  const finishSurvey = () => {
    const a = answers.current;
    const regions: Region[] = Array.isArray(a[0])
      ? a[0]
      : [{ sido: String(a[0] ?? ''), sigungu: '' }];
    const personality: string[] = Array.isArray(a[1])
      ? a[1]
      : [String(a[1] ?? PERSONALITY_OPTIONS[0])];
    const workplace: WorkplaceOption[] = Array.isArray(a[2])
      ? a[2]
      : WORKPLACE_OPTIONS.filter((o) => o.display === a[2]).slice(0, 1);
    const activityLevel = String(a[3] ?? ACTIVITY_OPTIONS[2]);
    const environment = String(a[4] ?? ENVIRONMENT_OPTIONS[2]);
    const workDays = String(a[5] ?? WORKDAYS_OPTIONS[2]);
    const certifications: string[] = Array.isArray(a[6]) ? a[6] : ['없음'];

    setSurveyAnswers({
      regions, personality, workplace,
      activityLevel, environment, workDays, certifications,
    });
    router.push('/loading');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ProgressBar current={step + 1} total={TOTAL_STEPS} />

      <View style={styles.container}>
        <Text style={styles.questionText}>{VOICE_QUESTIONS[step]}</Text>

        {transcript ? (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptText}>"{transcript}"</Text>
          </View>
        ) : null}

        <View style={styles.micArea}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <Animated.View style={micStyle}>
            <TouchableOpacity
              style={[styles.micBtn, isRecording && styles.micBtnActive]}
              onPress={handleMicPress}
              activeOpacity={0.8}
            >
              <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.guideWrap}>
          <Text style={styles.guideText}>마이크 버튼을 눌러 말씀해 주세요</Text>
          <Text style={styles.guideText}>버튼을 다시 누르면 다음 문항으로 넘어갑니다</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8F5E9' },

  fallbackContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, gap: 24,
  },
  fallbackIcon: { fontSize: 72 },
  fallbackTitle: {
    fontSize: 28, fontWeight: '800', color: '#1B5E20', textAlign: 'center',
  },
  fallbackCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
    width: '100%', gap: 14, borderWidth: 1.5, borderColor: '#C8E6C9',
  },
  fallbackBody: { fontSize: 22, color: '#333', textAlign: 'center', lineHeight: 34 },
  fallbackBold: { fontWeight: '800', color: '#1B5E20' },
  fallbackBody2: { fontSize: 20, color: '#555', textAlign: 'center', lineHeight: 30 },
  fallbackBtn: {
    backgroundColor: '#43A047', borderRadius: 20, paddingVertical: 20,
    paddingHorizontal: 40, width: '100%', alignItems: 'center', elevation: 3,
  },
  fallbackBtnText: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  fallbackBackBtn: { paddingVertical: 12 },
  fallbackBackBtnText: { fontSize: 20, color: '#66BB6A', fontWeight: '600' },

  container: {
    flex: 1, alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: 24, paddingVertical: 20,
  },
  questionText: {
    fontSize: 24, fontWeight: '700', color: '#1B5E20',
    textAlign: 'center', lineHeight: 36,
  },
  transcriptBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '100%',
    borderWidth: 1.5, borderColor: '#A5D6A7',
  },
  transcriptText: { fontSize: 20, color: '#333', textAlign: 'center', lineHeight: 30 },
  micArea: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#43A047',
  },
  micBtn: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#43A047', alignItems: 'center', justifyContent: 'center',
    elevation: 8,
  },
  micBtnActive: { backgroundColor: '#E53935' },
  micIcon: { fontSize: 56 },
  guideWrap: { alignItems: 'center', gap: 8 },
  guideText: { fontSize: 20, color: '#388E3C', textAlign: 'center' },
});
