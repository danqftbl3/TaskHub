import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({ value, size = 120, stroke = 12, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const t = useTheme();
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(Math.max(0, Math.min(1, value)), { duration: 700, easing: Easing.out(Easing.cubic) }); }, [value, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label ?? 'Progress'} accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.highlight} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={t.accent} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} animatedProps={props} />
      </Svg>
      <Text style={{ position: 'absolute', color: t.text, fontWeight: '800', fontSize: size / 4.5 }}>{Math.round(value * 100)}%</Text>
    </View>
  );
}
