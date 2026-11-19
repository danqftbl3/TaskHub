import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { Button, tap } from './ui';
import type { GuideCard } from '../logic/types';

export function FlashCard({ card, status, onMark }: { card: GuideCard; status?: 'got' | 'review'; onMark: (v: 'got' | 'review') => void }) {
  const t = useTheme();
  const [flipped, setFlipped] = useState(false);
  const r = useSharedValue(0);
  const flip = () => { tap(); const n = !flipped; setFlipped(n); r.value = withTiming(n ? 1 : 0, { duration: 450 }); };
  const front = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateY: `${interpolate(r.value, [0, 1], [0, 180])}deg` }], opacity: r.value < 0.5 ? 1 : 0 }));
  const back = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateY: `${interpolate(r.value, [0, 1], [180, 360])}deg` }], opacity: r.value >= 0.5 ? 1 : 0 }));
  const face = { position: 'absolute' as const, inset: 0, borderRadius: 18, padding: 20, justifyContent: 'center' as const, backgroundColor: t.card, borderWidth: 1.5, borderColor: t.primary, backfaceVisibility: 'hidden' as const };
  return (
    <View style={{ gap: 10 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={flipped ? `Answer: ${card.a}. Tap to see question.` : `Question: ${card.q}. Tap to reveal the answer.`} onPress={flip} style={{ height: 190 }}>
        <Animated.View style={[face, front]} pointerEvents="none"><Text style={{ color: t.muted, fontSize: 12, fontWeight: '800' }}>QUESTION · tap to flip</Text><Text style={{ color: t.text, fontSize: 19, fontWeight: '700', marginTop: 8 }}>{card.q}</Text></Animated.View>
        <Animated.View style={[face, back, { backgroundColor: t.highlight }]} pointerEvents="none"><Text style={{ color: t.muted, fontSize: 12, fontWeight: '800' }}>ANSWER · source line {card.line}</Text><Text style={{ color: t.text, fontSize: 17, marginTop: 8 }}>{card.a}</Text></Animated.View>
      </Pressable>
      {flipped ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button style={{ flex: 1 }} label="Got it" icon="✓" onPress={() => { onMark('got'); }} variant={status === 'got' ? 'primary' : 'ghost'} />
          <Button style={{ flex: 1 }} label="Review Again" icon="↻" onPress={() => { onMark('review'); }} variant={status === 'review' ? 'primary' : 'ghost'} />
        </View>
      ) : null}
      {status ? <Text style={{ color: t.muted, fontSize: 13 }}>{status === 'got' ? '✓ Marked: Got it' : '↻ Marked: Review again'}</Text> : null}
    </View>
  );
}
