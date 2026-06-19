import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import FontScaleButtons from '../../components/FontScaleButtons';

// ProgressBar(33px) + 여백(17px) = 버튼 상단 위치 기준
const TOP_OFFSET = 50;

export default function SurveyLayout() {
  return (
    <View style={styles.root}>
      <Slot />
      {/* absoluteFillObject + box-none: 버튼 영역만 터치 수신, 나머지 통과 */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <FontScaleButtons topOffset={TOP_OFFSET} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
