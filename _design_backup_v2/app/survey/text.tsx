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

const TOTAL_STEPS = 7;

export default function TextSurvey() {
  const router = useRouter();
  const { setSurveyAnswers } = useAppContext();

  const [step, setStep] = useState(0);

  // Step 0 - Region
  const [regions, setRegions] = useState<Region[]>([]);
  const [sidoModal, setSidoModal] = useState(false);
  const [sigunguModal, setSigunguModal] = useState(false);
  const [tempSido, setTempSido] = useState('');

  // Step 1 - Personality (max 2)
  const [personality, setPersonality] = useState<string[]>([]);

  // Step 2 - Workplace (max 2)
  const [workplace, setWorkplace] = useState<WorkplaceOption[]>([]);

  // Step 3 - Activity
  const [activityLevel, setActivityLevel] = useState('');

  // Step 4 - Environment
  const [environment, setEnvironment] = useState('');

  // Step 5 - Work days
  const [workDays, setWorkDays] = useState('');

  // Step 6 - Certifications
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
        />;
      case 5:
        return <StepOptions
          question="일주일에 몇 일 정도 근무하기를 희망하시나요?"
          hint="1개 선택"
          options={WORKDAYS_OPTIONS.map((o) => ({ label: o, value: o }))}
          selected={workDays ? [workDays] : []}
          onToggle={(val) => setWorkDays(val)}
          onNext={handleNext}
          canNext={canProceed()}
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
        />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ProgressBar current={step + 1} total={TOTAL_STEPS} />
      <View style={styles.content}>
        {renderStep()}
      </View>

      {/* Sido Modal */}
      <Modal visible={sidoModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>시/도 선택</Text>
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
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setSidoModal(false)}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sigungu Modal */}
      <Modal visible={sigunguModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{tempSido} · 시/군/구 선택</Text>
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
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setSigunguModal(false)}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ── Step 0: Region ──────────────────────── */
function Step0Region({
  regions, onGPS, onOpenSido, onRemove, onNext, canNext,
}: {
  regions: Region[];
  onGPS: () => void;
  onOpenSido: () => void;
  onRemove: (i: number) => void;
  onNext: () => void;
  canNext: boolean;
}) {
  return (
    <Animated.View entering={FadeInRight.duration(600).springify()} exiting={FadeOutLeft.duration(400)} style={styles.stepWrap}>
      <Text style={styles.question}>원하는 근무 지역을 선택해주세요</Text>
      <Text style={styles.hint}>복수 선택 가능</Text>

      <TouchableOpacity style={styles.gpsBtn} onPress={onGPS} activeOpacity={0.8}>
        <Text style={styles.gpsBtnText}>📍 GPS로 자동 선택</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.manualBtn} onPress={onOpenSido} activeOpacity={0.8}>
        <Text style={styles.manualBtnText}>🗺 지역 직접 선택하기</Text>
      </TouchableOpacity>

      <ScrollView style={styles.tagScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tagWrap}>
          {regions.map((r, i) => (
            <TouchableOpacity key={i} style={styles.tag} onPress={() => onRemove(i)}>
              <Text style={styles.tagText}>{r.sido} {r.sigungu}  ✕</Text>
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
        <Text style={[styles.nextBtnText, !canNext && styles.nextBtnTextDisabled]}>다음</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ── Generic Option Step ─────────────────── */
function StepOptions({
  question, hint, options, selected, onToggle, onNext, canNext, nextLabel = '다음',
}: {
  question: string;
  hint: string;
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (v: string) => void;
  onNext: () => void;
  canNext: boolean;
  nextLabel?: string;
}) {
  return (
    <Animated.View entering={FadeInRight.duration(600).springify()} exiting={FadeOutLeft.duration(400)} style={styles.stepWrap}>
      <Text style={styles.question}>{question}</Text>
      <Text style={styles.hint}>{hint}</Text>
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
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
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
        <Text style={[styles.nextBtnText, !canNext && styles.nextBtnTextDisabled]}>{nextLabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  content: { flex: 1 },
  stepWrap: { flex: 1, padding: 20 },
  question: { fontSize: 26, fontWeight: '700', color: '#1B5E20', marginBottom: 6, lineHeight: 36 },
  hint: { fontSize: 19, color: '#66BB6A', marginBottom: 16 },
  gpsBtn: {
    backgroundColor: '#43A047', borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', marginBottom: 12,
  },
  gpsBtnText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  manualBtn: {
    backgroundColor: '#fff', borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', borderWidth: 2, borderColor: '#43A047', marginBottom: 20,
  },
  manualBtnText: { fontSize: 22, fontWeight: '700', color: '#43A047' },
  tagScroll: { flex: 1 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    backgroundColor: '#C8E6C9', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  tagText: { fontSize: 19, color: '#1B5E20', fontWeight: '600' },
  optScroll: { flex: 1 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#C8E6C9',
    borderRadius: 16, padding: 18, marginBottom: 12, gap: 14,
  },
  optionSelected: { borderColor: '#43A047', backgroundColor: '#F1F8E9' },
  radio: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2.5, borderColor: '#A5D6A7', alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: '#43A047' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#43A047' },
  optionText: { fontSize: 22, color: '#424242', flex: 1, lineHeight: 30 },
  optionTextSelected: { color: '#1B5E20', fontWeight: '600' },
  nextBtn: {
    backgroundColor: '#43A047', borderRadius: 20,
    paddingVertical: 18, alignItems: 'center', marginTop: 16,
  },
  nextBtnDisabled: { backgroundColor: '#C8E6C9' },
  nextBtnText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  nextBtnTextDisabled: { color: '#81C784' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '70%', paddingTop: 20,
  },
  modalTitle: { fontSize: 24, fontWeight: '700', color: '#1B5E20', textAlign: 'center', paddingBottom: 12 },
  modalItem: {
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#E8F5E9',
  },
  modalItemText: { fontSize: 22, color: '#333' },
  modalClose: {
    backgroundColor: '#E8F5E9', margin: 16, borderRadius: 16,
    paddingVertical: 14, alignItems: 'center',
  },
  modalCloseText: { fontSize: 22, fontWeight: '700', color: '#43A047' },
});
