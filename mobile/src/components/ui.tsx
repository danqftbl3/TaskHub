import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, TOUCH } from '../theme/tokens';

export const tap = () => { Haptics.selectionAsync().catch(() => {}); };
export const success = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.card, borderRadius: radius.md, padding: space.lg, borderWidth: 1, borderColor: t.cardBorder }, t.shadow, style]}>{children}</View>;
}

export const H = ({ children, size = 22 }: { children: React.ReactNode; size?: number }) => {
  const t = useTheme();
  return <Text accessibilityRole="header" style={{ color: t.text, fontSize: size, fontWeight: '800' }}>{children}</Text>;
};
export const P = ({ children, muted, style, size = 15 }: { children: React.ReactNode; muted?: boolean; style?: any; size?: number }) => {
  const t = useTheme();
  return <Text style={[{ color: muted ? t.muted : t.text, fontSize: size, lineHeight: size * 1.45 }, style]}>{children}</Text>;
};

interface BtnProps { label: string; onPress: () => void; variant?: 'primary' | 'ghost' | 'danger' | 'pill'; disabled?: boolean; style?: StyleProp<ViewStyle>; hint?: string; icon?: string }
export function Button({ label, onPress, variant = 'primary', disabled, style, hint, icon }: BtnProps) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.primary : variant === 'pill' ? t.highlight : 'transparent';
  const color = variant === 'primary' ? t.onPrimary : variant === 'danger' ? t.danger : t.text;
  const border = variant === 'ghost' ? t.primary : variant === 'danger' ? t.danger : 'transparent';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{ disabled }} disabled={disabled}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [{ minHeight: TOUCH, paddingHorizontal: space.lg, borderRadius: variant === 'pill' ? radius.pill : radius.sm, backgroundColor: bg, borderWidth: 1.5, borderColor: border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, opacity: disabled ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      {icon ? <Text style={{ color, fontSize: 16 }}>{icon}</Text> : null}
      <Text style={{ color, fontWeight: '700', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, error, ...rest }: TextInputProps & { label: string; error?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={t.muted}
        style={[{ minHeight: TOUCH, borderRadius: radius.sm, borderWidth: 1.5, borderColor: error ? t.danger : t.highlight, backgroundColor: t.card, color: t.text, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 }, rest.multiline && { minHeight: 140, textAlignVertical: 'top' }]}
        {...rest} />
      {error ? <Text accessibilityRole="alert" style={{ color: t.danger, fontSize: 13 }}>⚠ {error}</Text> : null}
    </View>
  );
}

export function Badge({ label, tone = 'primary' }: { label: string; tone?: 'primary' | 'accent' | 'muted' }) {
  const t = useTheme();
  const c = tone === 'accent' ? t.accent : tone === 'muted' ? t.muted : t.primary;
  return <View style={{ borderRadius: radius.pill, backgroundColor: t.highlight, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: c }}><Text style={{ color: t.text, fontSize: 12, fontWeight: '700' }}>{label}</Text></View>;
}

export const styles = StyleSheet.create({ screen: { padding: space.lg, gap: space.lg, paddingBottom: 120 }, row: { flexDirection: 'row', alignItems: 'center', gap: space.sm } });
