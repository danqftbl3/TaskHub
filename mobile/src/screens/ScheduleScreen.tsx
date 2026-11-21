import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppHeader } from '../components/Header';
import { Badge, Button, Card, Field, H, P, styles, success, tap } from '../components/ui';
import { CheckBox } from '../components/CheckBox';
import { ProgressRing } from '../components/ProgressRing';
import { Sheet } from '../components/Sheet';
import { useTheme } from '../theme/ThemeProvider';
import { useData, useStore, useUser } from '../context/store';
import { addDays, dayKey, fmtDay, isValidDay } from '../logic/dates';
import { progress } from '../logic/chunker';

export function ScheduleScreen() {
  const t = useTheme(); const user = useUser(); const { assignments, guides } = useData();
  const { toggleStep, addAssignment, rescheduleAssignment } = useStore();
  const today = dayKey();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', due: addDays(today, 5), description: '' });
  const [err, setErr] = useState('');
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [from, setFrom] = useState(today);
  const [rescheduleError, setRescheduleError] = useState('');

  const todays = useMemo(() => assignments.flatMap((a) => a.steps.filter((s) => s.day === today || (s.done && s.doneAt === today)).map((s) => ({ a, s }))), [assignments, today]);
  const done = todays.filter((x) => x.s.done).length;
  const pct = todays.length ? done / todays.length : 0;
  const upcoming = assignments.filter((a) => progress(a) < 100);

  const save = () => {
    if (!f.title.trim()) return setErr('Give the assignment a title.');
    if (!isValidDay(f.due)) return setErr('Use the date format YYYY-MM-DD.');
    if (f.due < today) return setErr('Due date can’t be in the past.');
    addAssignment(f); success(); setOpen(false); setErr(''); setF({ title: '', due: addDays(today, 5), description: '' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.screen}>
        <H size={26}>Ready to conquer today, {user?.name.split(' ')[0] ?? 'friend'}?</H>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <ProgressRing value={pct} label="Today's progress" />
          <View style={{ flex: 1, gap: 6 }}>
            <P style={{ fontWeight: '800' }} size={17}>{todays.length ? `${done} of ${todays.length} finished • ${Math.round(pct * 100)}%` : 'Nothing scheduled today'}</P>
            <P muted>{todays.length && done === todays.length ? '🎉 All done. Great focus!' : 'Small steps add up. Start with one block.'}</P>
          </View>
        </Card>
        <Button label="Add assignment" icon="＋" onPress={() => setOpen(true)} />

        <H size={19}>Today's timeline</H>
        {todays.length === 0 ? <Card><P muted>No study blocks today. Add an assignment and TaskHub will split it into 20–35 minute steps.</P></Card> : null}
        {todays.map(({ a, s }, i) => (
          <Animated.View key={s.id} entering={FadeInDown.delay(i * 50)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 }}>
              <CheckBox checked={s.done} label={`${s.title}, ${s.minutes} minutes, ${a.title}`} onChange={() => { const d = toggleStep(a.id, s.id); d ? success() : tap(); }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, textDecorationLine: s.done ? 'line-through' : 'none' }}>{s.title}</Text>
                <P muted size={13}>{a.title}</P>
              </View>
              <Badge label={`${s.minutes} min`} />
            </Card>
          </Animated.View>
        ))}

        <H size={19}>Assignments</H>
        {upcoming.length === 0 ? <Card><P muted>No active assignments.</P></Card> : null}
        {upcoming.map((a) => (
          <Card key={a.id} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, flex: 1 }}>{a.title}</Text>
              <Badge tone="muted" label={`Due ${fmtDay(a.due, today)}`} />
            </View>
            <P muted size={13}>{a.steps.filter((s) => s.done).length}/{a.steps.length} steps • {Math.round(progress(a))}% done</P>
            <Button variant="ghost" label="Reschedule remaining sessions" onPress={() => {
              setFrom(a.rescheduleFrom && a.rescheduleFrom > today ? a.rescheduleFrom : today);
              setRescheduleError('');
              setRescheduling(a.id);
            }} />
          </Card>
        ))}

        {guides.length ? (
          <Card style={{ backgroundColor: t.highlight }}>
            <P style={{ fontWeight: '800' }}>Review next</P>
            <P size={14}>Quick-review "{guides[0].title}" ({guides[0].subject}): flip through its flashcards in the Study Vault for 10 minutes.</P>
          </Card>
        ) : null}
      </ScrollView>

      <Sheet visible={open} title="New assignment" onClose={() => setOpen(false)}>
        <Field label="Title" value={f.title} onChangeText={(v) => setF({ ...f, title: v })} placeholder="e.g. Cold War essay" />
        <Field label="Due date (YYYY-MM-DD)" value={f.due} onChangeText={(v) => setF({ ...f, due: v })} autoCapitalize="none" />
        <Field label="Notes (optional)" value={f.description} onChangeText={(v) => setF({ ...f, description: v })} multiline placeholder="What does the assignment ask for?" />
        {err ? <Text accessibilityRole="alert" style={{ color: t.danger }}>⚠ {err}</Text> : null}
        <Button label="Break it into steps" onPress={save} />
      </Sheet>
      <Sheet visible={rescheduling !== null} title="Reschedule sessions" onClose={() => setRescheduling(null)}>
        <P muted>Choose a start date between today and the assignment due date. Completed sessions stay unchanged.</P>
        <Field label="Start date (YYYY-MM-DD)" value={from} onChangeText={setFrom} autoCapitalize="none" error={rescheduleError} />
        <Button label="Reschedule" onPress={() => {
          if (!rescheduling || !rescheduleAssignment(rescheduling, from)) {
            setRescheduleError('Choose a valid date for the remaining sessions.');
            return;
          }
          success();
          setRescheduling(null);
        }} />
      </Sheet>
    </View>
  );
}
