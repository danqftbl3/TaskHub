import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { AppHeader } from '../components/Header';
import { Card, P, tap } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { useData, useStore } from '../context/store';
import { respond } from '../services/tutor';
import { uid } from '../logic/dates';
import type { RefusalStep } from '../logic/types';
import { TOUCH } from '../theme/tokens';

export function TutorScreen() {
  const t = useTheme(); const { chat, guides } = useData(); const pushChat = useStore((s) => s.pushChat);
  const [text, setText] = useState(''); const list = useRef<FlatList>(null);
  const terms = guides.flatMap((g) => g.terms.map((x) => x.term)).slice(0, 3);
  const prompts = [...terms.map((x) => `Explain "${x}" to me`), 'Do my Cold War homework'].slice(0, 4);

  const send = (raw: string) => {
    const q = raw.trim(); if (!q) return;
    const r = respond(q, guides);
    pushChat([{ id: uid(), role: 'user', text: q }, { id: uid(), role: 'bot', text: r.text, reply: r }]);
    setText('');
    setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.background }}>
      <AppHeader title="Tutor AI" />
      <FlatList ref={list} data={chat} keyExtractor={(m) => m.id} contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={<Card><P>I guide you step by step. I'll never write your homework, but I'll help you understand it. 💡</P></Card>}
        renderItem={({ item }) => item.role === 'user' ? (
          <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: t.primary, borderRadius: 18, padding: 12 }}><Text style={{ color: t.onPrimary, fontSize: 15 }}>{item.text}</Text></View>
        ) : (
          <View accessibilityLabel="Tutor reply" style={{ alignSelf: 'flex-start', maxWidth: '92%', backgroundColor: t.card, borderRadius: 18, padding: 14, gap: 10, borderWidth: 1, borderColor: item.reply?.refused ? t.primary : t.cardBorder }}>
            {item.reply?.refused ? <Text style={{ color: t.primary, fontWeight: '800', fontSize: 12 }}>🛡 HOMEWORK GUARDRAIL</Text> : null}
            <P>{item.text}</P>
            {item.reply?.steps.map((s: RefusalStep, i: number) => (
              <View key={i} style={{ gap: 4, backgroundColor: t.highlight, borderRadius: 12, padding: 10 }}>
                <P style={{ fontWeight: '800' }}>{s.title}</P>
                {s.body ? <P size={14}>{s.body}</P> : null}
                {s.items?.map((it: string, j: number) => <P key={j} size={14}>{j + 1}. {it}</P>)}
                {s.question ? <P size={14} style={{ fontStyle: 'italic' }}>❓ {s.question}</P> : null}
              </View>
            ))}
          </View>
        )}
        ListFooterComponent={<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {prompts.map((p) => <Pressable key={p} accessibilityRole="button" accessibilityLabel={`Ask: ${p}`} onPress={() => { tap(); send(p); }} style={{ minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 999, backgroundColor: t.highlight }}><Text style={{ color: t.text, fontWeight: '600' }}>{p}</Text></Pressable>)}
        </View>}
      />
      <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: t.highlight }}>
        <TextInput accessibilityLabel="Message the tutor" value={text} onChangeText={setText} onSubmitEditing={() => send(text)} placeholder="Ask about a topic…" placeholderTextColor={t.muted} returnKeyType="send"
          style={{ flex: 1, minHeight: TOUCH, borderRadius: 12, borderWidth: 1.5, borderColor: t.highlight, backgroundColor: t.card, color: t.text, paddingHorizontal: 14, fontSize: 16 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Send message" onPress={() => send(text)} style={{ minHeight: TOUCH, minWidth: TOUCH + 16, borderRadius: 12, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: t.onPrimary, fontWeight: '800' }}>Send</Text></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
