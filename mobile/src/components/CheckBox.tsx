import React, { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { TOUCH } from './../theme/tokens';

export function CheckBox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  const t = useTheme();
  const s = useSharedValue(1);
  useEffect(() => { if (checked) s.value = withSequence(withSpring(1.3), withSpring(1)); }, [checked, s]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked }} onPress={onChange} style={{ width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: checked ? t.accent : t.muted, backgroundColor: checked ? t.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }, a]}>
        {checked ? <Text style={{ color: t.background, fontWeight: '900', fontSize: 16 }}>✓</Text> : null}
      </Animated.View>
    </Pressable>
  );
}
