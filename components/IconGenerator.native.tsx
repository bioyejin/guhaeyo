import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import AppIcon from './AppIcon';

export const ICON_SAVE_PATH = FileSystem.documentDirectory + 'icon_generated.png';
const ICON_SIZE = 1024;

interface Props {
  onGenerated?: (uri: string) => void;
}

export default function IconGenerator({ onGenerated }: Props) {
  const ref = useRef<ViewShot>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const uri = await (ref.current as any)?.capture?.();
        if (!uri) return;
        await FileSystem.copyAsync({ from: uri, to: ICON_SAVE_PATH });
        onGenerated?.(ICON_SAVE_PATH);
      } catch (e) {
        console.warn('[IconGenerator]', e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.offscreen} pointerEvents="none">
      <ViewShot
        ref={ref}
        options={{ format: 'png', quality: 1, width: ICON_SIZE, height: ICON_SIZE }}
      >
        <AppIcon size={ICON_SIZE} borderRadius={0} />
      </ViewShot>
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -(ICON_SIZE + 20),
    top: -(ICON_SIZE + 20),
    width: ICON_SIZE,
    height: ICON_SIZE,
    opacity: 0,
  },
});
