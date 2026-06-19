import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
} from 'react-native-reanimated';

interface Option {
  label: string;
  value: string;
}

interface Props {
  question: string;
  options: Option[];
  selected: string[];
  maxSelect: number;
  onSelect: (value: string) => void;
  onNext: () => void;
}

export default function SurveyCard({
  question,
  options,
  selected,
  maxSelect,
  onSelect,
  onNext,
}: Props) {
  const canNext = selected.length > 0;

  return (
    <Animated.View
      entering={FadeInRight.duration(600).springify()}
      exiting={FadeOutLeft.duration(400)}
      style={styles.container}
    >
      <Text style={styles.question}>{question}</Text>
      {maxSelect > 1 && (
        <Text style={styles.hint}>최대 {maxSelect}개 선택 가능</Text>
      )}
      <ScrollView
        style={styles.optionsScroll}
        showsVerticalScrollIndicator={false}
      >
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onSelect(opt.value)}
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
        <Text style={[styles.nextBtnText, !canNext && styles.nextBtnTextDisabled]}>
          다음
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 22,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D1B3E',
    marginBottom: 6,
    lineHeight: 34,
    letterSpacing: 0.1,
  },
  hint: {
    fontSize: 16,
    color: '#6B7A99',
    marginBottom: 20,
  },
  optionsScroll: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D4DCF0',
    borderRadius: 10,
    padding: 18,
    marginBottom: 10,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  optionSelected: {
    borderColor: '#2060E0',
    borderWidth: 2,
    backgroundColor: '#EBF2FF',
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#B0B8D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2060E0',
    backgroundColor: '#2060E0',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 20,
    color: '#2C3550',
    flex: 1,
    lineHeight: 28,
  },
  optionTextSelected: {
    color: '#0D1B3E',
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: '#2060E0',
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#2060E0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  nextBtnDisabled: {
    backgroundColor: '#C8D4F0',
    elevation: 0,
    shadowOpacity: 0,
  },
  nextBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextBtnTextDisabled: {
    color: '#8896BB',
  },
});
