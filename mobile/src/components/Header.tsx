import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useStore, useStreak } from '../context/store';
import { Badge, tap } from './ui';
import { TOUCH } from '../theme/tokens';

export function ThemeToggle() {
  const t = useTheme(); const setTheme = useStore((s) => s.setTheme);
  const dark = t.name === 'dark';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={dark ? 'Switch to light mode' : 'Switch to dark mode'} onPress={() => { tap(); setTheme(dark ? 'light' : 'dark'); }}
      style={{ width: TOUCH, height: TOUCH, borderRadius: 22, backgroundColor: t.highlight, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20 }}>{dark ? '☀️' : '🌙'}</Text>
    </Pressable>
  );
}
export const StreakBadge = () => { const n = useStreak(); return <Badge tone="accent" label={`🔥 ${n} ${n === 1 ? 'Day' : 'Days'}`} />; };

export function AppHeader({ title, right }: { title?: string; right?: React.ReactNode }) {
  const t = useTheme(); const ins = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: ins.top + 6, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.background }}>
      <Text accessibilityRole="header" style={{ color: t.text, fontSize: 24, fontWeight: '900' }}>{title ?? 'Task'}{title ? '' : <Text style={{ color: t.primary }}>Hub</Text>}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{right}<StreakBadge /><ThemeToggle /></View>
    </View>
  );
}
