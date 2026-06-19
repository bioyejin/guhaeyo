import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeInRight,
  FadeOutLeft,
} from 'react-native-reanimated';
import ProgressBar from '../../components/ProgressBar';
import { useAppContext } from '../_layout';
import { getCurrentRegion } from '../../utils/locationHelper';
import {
  SIDO_LIST,
  SIGUNGU_MAP,
  PERSONALITY_OPTIONS,
  WORKPLACE_OPTIONS,
  ACTIVITY_OPTIONS,
  ENVIRONMENT_OPTIONS,
  WORKDAYS_OPTIONS,
  CERTIFICATION_OPTIONS,
} from '../../constants/surveyData';
import type { Region, WorkplaceOption } from '../../utils/types';
import { useFontScale } from '../../contexts/FontScaleContext';
import { colors, FONT } from '../../constants/colors';

const TOTAL_STEPS = 7;

export default function TextSurvey() {
  const router = useRouter();
  const { setSurveyAnswers } = useAppContext();
  const { fontScale } = useFontScale();

  const [step, setStep] = useState(0);

  const [regions, setRegions] = useState<Region[]>([]);
  const [sidoModal, setSidoModal] = useState(false);
  const [sigunguModal, setSigunguModal] = useState(false);
  const [tempSido, setTempSido] = useState('');

  const [personality, setPersonality] = useState<string[]>([]);
  const [workplace, setWorkplace] = useState<WorkplaceOption[]>([]);
  const [activityLevel, setActivityLevel] = useState('');
  const [environment, setEnvironment] = useState('');
  const [workDays, setWorkDays] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);

  const canProceed = useCallback(() => {
    switch (step) {
      case 0: return regions.length > 0;
      case 1: return personality.length > 0;
      case 2: return workplace.length > 0;
      case 3: return activityLevel !== '';
      case 4: return environment !== '';
      case 5: return workDays !== '';
      case 6: return certifications.length > 0;
      default: return false;
    }
  }, [step, regions, personality, workplace, activityLevel, environment, workDays, certifications]);

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      setSurveyAnswers({ regions, personality, workplace, activityLevel, environment, workDays, certifications });
      router.push('/loading');
    }
  };

  const handleGPS = async () => {
    const region = await getCurrentRegion();
    if (region) {
      const exists = regions.some((r) => r.sido === region.sido && r.sigungu === region.sigungu);
      if (!exists) setRegions((prev) => [...prev, region]);
      Alert.alert('위치 확인', `${region.sido} ${region.sigungu}을(를) 추가했습니다.`);
    } else {
      Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다. 수동으로 선택해 주세요.');
    }
  };

  const removeRegion = (idx: number) => {
    setRegions((prev) => prev.filter((_, i) => i !== idx));
  };

  const togglePersonality = (val: string) => {
    setPersonality((prev) => {
      if (prev.includes(val)) return prev.filter((v) => v !== val);
      if (prev.length >= 2) return prev;
      return [...prev, val];
    });
  };

  const toggleWorkplace = (opt: WorkplaceOption) => {
    setWorkplace((prev) => {
      const exists = prev.some((w) => w.display === opt.display);
      if (exists) return prev.filter((w) => w.display !== opt.display);
      if (prev.length >= 2) return prev;
      return [...prev, opt];
    });
  };

  const toggleCertification = (val: string) => {
    if (val === '없음') {
      setCertifications(['없음']);
      return;
    }
    setCertifications((prev) => {
      const withoutNone = prev.filter((v) => v !== '없음');
      if (withoutNone.includes(val)) return withoutNone.filter((v) => v !== val);
      return [...withoutNone, val];
    });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <Step0Region
          regions={regions}
          onGPS={handleGPS}
          onOpenSido={() => setSidoModal(true)}
          onRemove={removeRegion}
          onNext={handleNext}
          canNext={canProceed()}
          fontScale={fontScale}
        />;
      case 1:
        return <StepOptions
          question="나와 가장 잘 맞는 성격은 무엇인가요?"
          hint="최대 2개 선택"
          options={PERSONALITY_OPTIONS.map((o) => ({ label: o, value: o }))}
          selected={personality}
          onToggle={togglePersonality}
          onNext={handleNext}
          canNext={canProceed()}
          fontScale={fontScale}
        />;
      case 2:
        return <StepOptions
          question="가장 끌리는 일터 장면을 골라주세요"
          hint="최대 2개 선택"
          options={WORKPLACE_OPTIONS.map((o) => ({ label: o.display, value: o.display }))}
          selected={workplace.map((w) => w.display)}
          onToggle={(val) => {
            const opt = WORKPLACE_OPTIONS.find((o) => o.display === val);
            if (opt) toggleWorkplace(opt);
          }}
          onNext={handleNext}
          canNext={canProceed()}
          fontScale={fontScale}
        />;
      case 3:
        return <StepOptions
          question="하루에 감당할 수 있는 활동량은 어느 정도인가요?"
          hint="1개 선택"
          options={ACTIVITY_OPTIONS.map((o) => ({ label: o, value: o }))}
          selected={activityLevel ? [activityLevel] : []}
          onToggle={(val) => setActivityLevel(val)}
          onNext={handleNext}
          canNext={canProceed()}
          fontScale={fontScale}
        />;
      case 4:
        return <StepOptions
          question="선호하시는 일터 환경은 어디인가요?"
          hint="1개 선택"
          options={ENVIRONMENT_OPTIONS.map((o) => ({ label: o, value: o }))}
          selected={environment ? [environment] : []}
          onToggle={(val) => setEnvironment(val)}
          onNext={handleNext}
          canNext={canProceed()}
          fontScale={fontScale}
        />;
      case 5:
        return <StepOptions
          question="일주일에 며칠 정도 근무하기를 희망하시나요?"
          hint="1개 선택"
          options={WORKDAYS_OPTIONS.map((o) => ({ label: o, value: o }))}
          selected={workDays ? [workDays] : []}
          onToggle={(val) => setWorkDays(val)}
          onNext={handleNext}
          canNext={canProceed()}
          fontScale={fontScale}
        />;
      case 6:
        return <StepOptions
          question="보유 중인 자격증이 있다면 체크해주세요"
          hint="없으면 '없음' 선택"
          options={CERTIFICATION_OPTIONS.map((o) => ({ label: o, value: o }))}
          selected={certifications}
          onToggle={toggleCertification}
          onNext={handleNext}
          canNext={canProceed()}
          nextLabel="결과 보기"
          fontScale={fontScale}
        />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <Image
        source={require('../../assets/images/flower_bg.png')}
        style={[StyleSheet.absoluteFillObject, styles.flowerBg]}
        resizeMode="cover"
      />
      <ProgressBar current={step + 1} total={TOTAL_STEPS} />
      <View style={styles.content}>
        {renderStep()}
      </View>

      {/* Sido Modal */}
      <Modal visible={sidoModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={[styles.modalTitle, { fontSize: 22 * fontScale }]}>시/도 선택</Text>
            <FlatList
              data={SIDO_LIST}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setTempSido(item);
                    setSidoModal(false);
                    setSigunguModal(true);
                  }}
                >
                  <Text style={[styles.modalItemText, { fontSize: 22 * fontScale }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setSidoModal(false)}>
              <Text style={[styles.modalCloseText, { fontSize: 22 * fontScale }]}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sigungu Modal */}
      <Modal visible={sigunguModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={[styles.modalTitle, { fontSize: 22 * fontScale }]}>{tempSido} · 시/군/구 선택</Text>
            <FlatList
              data={SIGUNGU_MAP[tempSido] ?? []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    const newRegion: Region = { sido: tempSido, sigungu: item };
                    const exists = regions.some(
                      (r) => r.sido === newRegion.sido && r.sigungu === newRegion.sigungu
                    );
                    if (!exists) setRegions((prev) => [...prev, newRegion]);
                    setSigunguModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { fontSize: 22 * fontScale }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setSigunguModal(false)}>
              <Text style={[styles.modalCloseText, { fontSize: 22 * fontScale }]}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ── Step 0: Region ──────────────────────── */
function Step0Region({
  regions, onGPS, onOpenSido, onRemove, onNext, canNext, fontScale,
}: {
  regions: Region[];
  onGPS: () => void;
  onOpenSido: () => void;
  onRemove: (i: number) => void;
  onNext: () => void;
  canNext: boolean;
  fontScale: number;
}) {
  return (
    <Animated.View entering={FadeInRight.duration(600).springify()} exiting={FadeOutLeft.duration(400)} style={styles.stepWrap}>
      <Text style={[styles.question, { fontSize: 25 * fontScale }]}>원하는 근무 지역을 선택해주세요</Text>
      <Text style={[styles.hint, { fontSize: 16 * fontScale }]}>복수 선택 가능</Text>

      <TouchableOpacity style={styles.gpsBtn} onPress={onGPS} activeOpacity={0.8}>
        <Text style={[styles.gpsBtnText, { fontSize: 22 * fontScale }]}>GPS 자동 위치 선택</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.manualBtn} onPress={onOpenSido} activeOpacity={0.8}>
        <Text style={[styles.manualBtnText, { fontSize: 22 * fontScale }]}>지역 직접 선택하기</Text>
      </TouchableOpacity>

      <ScrollView style={styles.tagScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tagWrap}>
          {regions.map((r, i) => (
            <TouchableOpacity key={i} style={styles.tag} onPress={() => onRemove(i)}>
              <Text style={[styles.tagText, { fontSize: 18 * fontScale }]}>{r.sido} {r.sigungu}  ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
        onPress={onNext}
        disabled={!canNext}
        activeOpacity={0.8}
      >
        <Text style={[styles.nextBtnText, { fontSize: 24 * fontScale }, !canNext && styles.nextBtnTextDisabled]}>다음</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── Generic Option Step ─────────────────── */
function StepOptions({
  question, hint, options, selected, onToggle, onNext, canNext, nextLabel = '다음', fontScale,
}: {
  question: string;
  hint: string;
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (v: string) => void;
  onNext: () => void;
  canNext: boolean;
  nextLabel?: string;
  fontScale: number;
}) {
  return (
    <Animated.View entering={FadeInRight.duration(600).springify()} exiting={FadeOutLeft.duration(400)} style={styles.stepWrap}>
      <Text style={[styles.question, { fontSize: 25 * fontScale }]}>{question}</Text>
      <Text style={[styles.hint, { fontSize: 16 * fontScale }]}>{hint}</Text>
      <ScrollView style={styles.optScroll} showsVerticalScrollIndicator={false}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onToggle(opt.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.optionText, { fontSize: 22 * fontScale }, isSelected && styles.optionTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity
        style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
        onPress={onNext}
        disabled={!canNext}
        activeOpacity={0.8}
      >
        <Text style={[styles.nextBtnText, { fontSize: 24 * fontScale }, !canNext && styles.nextBtnTextDisabled]}>{nextLabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flowerBg: { opacity: 0.06 },
  content: { flex: 1 },
  stepWrap: { flex: 1, paddingHorizontal: 22, paddingTop: 80, paddingBottom: 24 },
  question: { fontFamily: FONT, color: colors.textDark, marginBottom: 6, lineHeight: 36, letterSpacing: 0.1 },
  hint: { fontFamily: FONT, color: colors.textMid, marginBottom: 18 },
  gpsBtn: {
    backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 18,
    alignItems: 'center', marginBottom: 12,
    shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  gpsBtnText: { fontFamily: FONT, color: '#fff' },
  manualBtn: {
    backgroundColor: colors.bgCard, borderRadius: 10, paddingVertical: 18,
    alignItems: 'center', borderWidth: 2, borderColor: colors.primary, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  manualBtnText: { fontFamily: FONT, color: colors.primary },
  tagScroll: { flex: 1 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    backgroundColor: colors.pinkLight, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 11,
    borderWidth: 1, borderColor: colors.border,
  },
  tagText: { fontFamily: FONT, color: colors.textDark },
  optScroll: { flex: 1 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 10, padding: 18, marginBottom: 10, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  optionSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.pinkLight },
  radio: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  optionText: { fontFamily: FONT, color: colors.textDark, flex: 1, lineHeight: 30 },
  optionTextSelected: { color: colors.textDark },
  nextBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 20, alignItems: 'center', marginTop: 16,
    shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  nextBtnDisabled: { backgroundColor: colors.border, elevation: 0, shadowOpacity: 0 },
  nextBtnText: { fontFamily: FONT, color: '#fff' },
  nextBtnTextDisabled: { color: colors.textLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(92,61,46,0.4)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '70%', paddingTop: 22,
  },
  modalTitle: { fontFamily: FONT, color: colors.textDark, textAlign: 'center', paddingBottom: 14 },
  modalItem: {
    paddingHorizontal: 26, paddingVertical: 17,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalItemText: { fontFamily: FONT, color: colors.textDark },
  modalClose: {
    backgroundColor: colors.pinkLight, margin: 16, borderRadius: 10,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  modalCloseText: { fontFamily: FONT, color: colors.primary },
});
