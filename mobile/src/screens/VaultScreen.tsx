import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { AppHeader } from '../components/Header';
import { Badge, Button, Card, Field, H, P, styles, tap } from '../components/ui';
import { FlashCard } from '../components/FlashCard';
import { Sheet } from '../components/Sheet';
import { useTheme } from '../theme/ThemeProvider';
import { useData, useStore } from '../context/store';
import { AddNotesSheet } from './AddNotesSheet';
import type { Guide, Term } from '../logic/types';
import { TOUCH } from '../theme/tokens';

const Missing = ({ what }: { what: string }) => <Card><P muted>Not found in your notes: no {what} could be drawn from this material, and TaskHub won't invent any.</P></Card>;

function PracticeQuiz({ guide }: { guide: Guide }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const cards = guide.cards.slice(0, 5);
  const card = cards[index];
  if (!cards.length) return <P muted>Add notes with definitions to make practice questions.</P>;
  const grade = (understood: boolean) => {
    if (understood) setCorrect((value) => value + 1);
    setIndex((value) => value + 1);
    setAnswer('');
    setRevealed(false);
  };
  return <Card style={{ gap: 12 }}>
    {card ? <>
      <P muted>Question {index + 1} of {cards.length}</P>
      <P>{card.q}</P>
      <Field label="Your answer" value={answer} onChangeText={setAnswer} multiline editable={!revealed} />
      {revealed ? <>
        <P style={{ fontWeight: '700' }}>Answer from your notes</P>
        <P>{card.a}</P>
        <P muted size={13}>Source line {card.line}</P>
        <P muted>How did you do?</P>
        <Button variant="ghost" label="Review again" onPress={() => grade(false)} />
        <Button label="Got it" onPress={() => grade(true)} />
      </> : <Button label="Show answer" onPress={() => setRevealed(true)} />}
    </> : <>
      <H size={19}>Quiz complete</H>
      <P>You marked {correct} of {cards.length} answers as understood.</P>
      <Button variant="ghost" label="Try again" onPress={() => { setIndex(0); setCorrect(0); setAnswer(''); setRevealed(false); }} />
    </>}
  </Card>;
}

export function VaultScreen() {
  const t = useTheme(); const { guides, cardProgress } = useData();
  const { addGuide, loadDemo, removeGuide, markCard } = useStore();
  const [active, setActive] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [term, setTerm] = useState<Term | null>(null);
  const [mode, setMode] = useState<'analogy' | 'academic'>('analogy');
  const guide: Guide | undefined = guides.find((g) => g.id === active) ?? guides[0];
  useEffect(() => { if (active && !guides.some((g) => g.id === active)) setActive(null); }, [guides, active]);

  const demoLoaded = guides.some((g) => g.demo);
  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <AppHeader title="Study Vault" />
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Button label="+ Add notes" onPress={() => setAdding(true)} />
          {!demoLoaded ? <Button variant="pill" label="Load Demo Sample (Cold War)" onPress={() => setActive(loadDemo())} /> : null}
        </View>

        {!guide ? (
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 32 }}>
            <Text style={{ fontSize: 42 }}>📚</Text>
            <H size={19}>Your vault is empty</H>
            <P muted style={{ textAlign: 'center' }}>No notes uploaded yet. Tap '+ Add notes' to generate your first study guide!</P>
            <Button label="Upload Your First Notes" onPress={() => setAdding(true)} />
          </Card>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityLabel="Guide selector">
              {guides.map((g) => {
                const on = g.id === guide.id;
                return (
                  <Pressable key={g.id} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={`${g.title}, ${g.subject}`} onPress={() => { tap(); setActive(g.id); }}
                    style={{ minHeight: TOUCH, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 999, backgroundColor: on ? t.primary : t.highlight }}>
                    <Text style={{ color: on ? t.onPrimary : t.text, fontWeight: '700' }}>{on ? '✓ ' : ''}{g.title}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={{ gap: 4 }}>
              <H size={24}>{guide.title}</H>
              <P muted size={13}>{guide.subject} · {guide.demo ? 'Sample guide' : `From ${guide.source.name}`}</P>
            </View>

            <H size={19}>Quick Takeaways</H>
            {guide.takeaways.length ? <Card style={{ gap: 8 }}>{guide.takeaways.map((k, i) => <P key={i}>• {k.text}  <Text style={{ color: t.muted, fontSize: 12 }}>[line {k.line}]</Text></P>)}</Card> : <Missing what="takeaways" />}

            <H size={19}>Exam Alerts</H>
            {guide.alerts.length ? guide.alerts.map((a, i) => (
              <Card key={i} style={{ gap: 6, borderLeftWidth: 4, borderLeftColor: a.emphasis === 3 ? t.danger : t.primary }}>
                <Badge tone={a.emphasis === 3 ? 'primary' : 'muted'} label={a.emphasis === 3 ? '⚠ Must know' : '◐ Likely'} />
                <P>{a.text}</P><P muted size={12}>Source line {a.line}</P>
              </Card>
            )) : <Missing what="exam alerts" />}

            <H size={19}>Key Terms</H>
            {guide.terms.length ? guide.terms.map((k, i) => (
              <Card key={i} style={{ gap: 6 }}>
                <Text style={{ color: t.primary, fontWeight: '800', fontSize: 17 }}>{k.term}</Text>
                <P>{k.def}</P><P muted size={13}>Source line {k.line}</P>
                <Button variant="pill" label="Tap for Deep Explainer" onPress={() => { setMode('analogy'); setTerm(k); }} />
              </Card>
            )) : <Missing what="key terms" />}

            <H size={19}>Common Mistakes</H>
            {guide.mistakes.length ? <Card style={{ gap: 8 }}>{guide.mistakes.map((m, i) => <P key={i}>⚠ {m.text} <Text style={{ color: t.muted, fontSize: 12 }}>[line {m.line}]</Text></P>)}</Card> : <Missing what="common mistakes" />}

            <H size={19}>Flashcards</H>
            {guide.cards.length ? guide.cards.map((c, i) => <FlashCard key={`${guide.id}-${i}`} card={c} status={cardProgress[`${guide.id}:${i}`]} onMark={(v) => markCard(`${guide.id}:${i}`, v)} />) : <Missing what="flashcards" />}

            <H size={19}>Practice quiz</H>
            <PracticeQuiz key={guide.id} guide={guide} />

            <Button variant="danger" label={guide.demo ? 'Remove sample guide' : 'Delete this guide'} hint="Deletes the guide from this device" onPress={() => removeGuide(guide.id)} />
          </>
        )}
      </ScrollView>

      <AddNotesSheet visible={adding} onClose={() => setAdding(false)} onSave={(p) => setActive(addGuide(p))} />
      <Sheet visible={!!term} title={term?.term ?? ''} onClose={() => setTerm(null)}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['analogy', 'academic'] as const).map((m) => (
            <Button key={m} style={{ flex: 1 }} variant={mode === m ? 'primary' : 'ghost'} label={m === 'analogy' ? 'Analogy (ELI5)' : 'In-Depth Walkthrough'} onPress={() => setMode(m)} />
          ))}
        </View>
        {term ? <Card><P>{mode === 'analogy' ? term.analogy : term.academic}</P></Card> : null}
        {term ? <Card><P style={{ fontWeight: '800' }}>Real-world example</P><P>{term.example}</P></Card> : null}
      </Sheet>
    </View>
  );
}
