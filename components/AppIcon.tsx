import React from 'react';
import { View, Image } from 'react-native';

interface Props {
  size?: number;
  borderRadius?: number;
}

export default function AppIcon({ size = 180, borderRadius = 36 }: Props) {
  return (
    <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
      <Image
        source={require('../assets/images/icon_generated.png')}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}
