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
    padding: 20,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
    lineHeight: 34,
  },
  hint: {
    fontSize: 16,
    color: '#66BB6A',
    marginBottom: 20,
  },
  optionsScroll: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#C8E6C9',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    gap: 14,
  },
  optionSelected: {
    borderColor: '#43A047',
    backgroundColor: '#F1F8E9',
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: '#A5D6A7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#43A047',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#43A047',
  },
  optionText: {
    fontSize: 20,
    color: '#424242',
    flex: 1,
    lineHeight: 28,
  },
  optionTextSelected: {
    color: '#1B5E20',
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: '#43A047',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  nextBtnDisabled: {
    backgroundColor: '#C8E6C9',
  },
  nextBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextBtnTextDisabled: {
    color: '#81C784',
  },
});
