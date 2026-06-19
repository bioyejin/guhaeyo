import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFontScale } from '../contexts/FontScaleContext';
import { colors, FONT } from '../constants/colors';

interface Props {
  topOffset?: number;
  small?: boolean;
}

export default function FontScaleButtons({ topOffset = 0, small = false }: Props) {
  const insets = useSafeAreaInsets();
  const { increaseFontScale, decreaseFontScale } = useFontScale();

  const btnStyle = small ? styles.btnSmall : styles.btn;
  const txtStyle = small ? styles.btnTextSmall : styles.btnText;

  return (
    <View
      style={[styles.container, small && styles.containerSmall, { top: insets.top + 4 + topOffset }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={btnStyle}
        onPress={decreaseFontScale}
        activeOpacity={0.75}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
      >
        <Text style={txtStyle}>가-</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={btnStyle}
        onPress={increaseFontScale}
        activeOpacity={0.75}
        hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
      >
        <Text style={txtStyle}>가+</Text>
      </TouchableOpacity>
    </View>
  );
}

/** 절대 위치 없이 플렉스 흐름 안에서 인라인으로 렌더링 */
export function FontScaleButtonsInline() {
  const { increaseFontScale, decreaseFontScale } = useFontScale();
  return (
    <View style={styles.inlineRow}>
      <TouchableOpacity
        style={styles.btn}
        onPress={decreaseFontScale}
        activeOpacity={0.75}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
      >
        <Text style={styles.btnText}>가-</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={increaseFontScale}
        activeOpacity={0.75}
        hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
      >
        <Text style={styles.btnText}>가+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 14,
    flexDirection: 'row',
    gap: 8,
    zIndex: 9999,
  },
  containerSmall: {
    gap: 6,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    paddingRight: 14,
  },
  btn: {
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 54,
  },
  btnSmall: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 42,
  },
  btnText: {
    fontSize: 16,
    fontFamily: FONT,
    color: colors.textDark,
    letterSpacing: 0.3,
  },
  btnTextSmall: {
    fontSize: 13,
    fontFamily: FONT,
    color: colors.textDark,
    letterSpacing: 0.3,
  },
});
