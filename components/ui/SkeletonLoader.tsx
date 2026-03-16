// Purpose: Animated shimmer skeleton loader using Moti for loading states

import React from 'react';
import { ViewStyle } from 'react-native';
import { MotiView } from 'moti';

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  return (
    <MotiView
      from={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{
        type: 'timing',
        duration: 800,
        loop: true,
        repeatReverse: true,
      }}
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: '#E8E8E3',
        },
        style,
      ]}
    />
  );
}
