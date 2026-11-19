import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { AppHeader } from '../components/Header';
import { Button, Card, Field, H, P, styles, success, tap } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { useTheme } from '../theme/ThemeProvider';
import { useData, useStore, useUser } from '../context/store';
import type { ThemePref } from '../theme/tokens';
import { TOUCH } from '../theme/tokens';
import { useStreak } from '../context/store';

const TO = 'danqftbl3@gmail.com', SUBJECT = 'TaskHub App Feedback - [v1.0]';
const THEMES: { v: ThemePref; l: string }[] = [{ v: 'system', l: 'System Default' }, { v: 'light', l: 'Light Mode' }, { v: 'dark', l: 'Dark Mode' }];

const confirm = (title: string, msg: string, ok: () => void) => {
  if (Platform.OS === 'web') { if (globalThis.confirm?.(`${title}\n${msg}`)) ok(); return; }
  Alert.alert(title, msg, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', style: 'destructive', onPress: ok }]);
};

export function SettingsScreen() {
  const t = useTheme(); const user = useUser(); const { assignments, sessionsDone, guides } = useData(); const streak = useStreak();
  const { themePref, setTheme, signOut, resetData, addFeedback } = useStore();
  const [fb, setFb] = useState(false); const [rating, setRating] = useState(0); const [comment, setComment] = useState(''); const [note, setNote] = useState('');

  const mail = async (body: string) => {
    try {
      if (await MailComposer.isAvailableAsync()) { await MailComposer.composeAsync({ recipients: [TO], subject: SUBJECT, body }); return; }
    } catch { /* fall through to mailto */ }
    await Linking.openURL(`mailto:${TO}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`).catch(() => setNote(`Couldn't open a mail app. Email ${TO} directly.`));
  };
  const submit = async () => {
    if (!rating) return setNote('Please choose a star rating.');
    addFeedback(rating, comment); success();
    await mail(`Rating: ${rating}/5\n\n${comment}`);
    setFb(false); setRating(0); setComment(''); setNote('');
  };

  const tasksDone = assignments.reduce((n, a) => n + a.steps.filter((s) => s.done).length, 0);
  const stat = (n: number | string, l: string) => <Card style={{ flex: 1, alignItems: 'center', padding: 12 }}><Text style={{ color: t.primary, fontWeight: '900', fontSize: 24 }}>{n}</Text><P muted size={12} style={{ textAlign: 'center' }}>{l}</P></Card>;

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.screen}>
        <Card style={{ gap: 4 }}>
          <H size={20}>{user?.name}</H><P muted>{user?.email}</P><P muted>Study level: {user?.level}</P>
          {user?.guest ? <P size={13} muted>Guest demo workspace. Sign up to keep your own data.</P> : null}
        </Card>

        <H size={18}>Theme</H>
        <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
          {THEMES.map(({ v, l }) => {
            const on = themePref === v;
            return (
              <Pressable key={v} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={l} onPress={() => { tap(); setTheme(v); }}
                style={{ minHeight: TOUCH, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: on ? t.highlight : t.card, borderWidth: 1.5, borderColor: on ? t.primary : t.highlight }}>
                <Text style={{ color: t.text, fontWeight: '600', fontSize: 16 }}>{l}</Text><Text style={{ color: t.primary, fontWeight: '900' }}>{on ? '✓ Selected' : ''}</Text>
              </Pressable>
            );
          })}
        </View>

        <H size={18}>Study Statistics</H>
        <View style={{ flexDirection: 'row', gap: 8 }}>{stat(sessionsDone, 'Study sessions')}{stat(tasksDone, 'Tasks finished')}{stat(`🔥 ${streak}`, 'Active streak')}</View>
        <P muted size={13}>{guides.length} study guide{guides.length === 1 ? '' : 's'} saved on this device.</P>

        <Card style={{ gap: 8 }}>
          <H size={18}>Give Feedback & Report Issues</H>
          <P muted>Help us make TaskHub better for your study sessions!</P>
          <Button label="Send Feedback" onPress={() => { setNote(''); setFb(true); }} />
        </Card>

        <H size={18}>Account</H>
        <Button label="Sign Out" variant="ghost" onPress={() => signOut()} />
        <Button label="Reset Stored Data" variant="danger" hint="Deletes your guides and tasks from this device"
          onPress={() => confirm('Reset stored data?', 'This permanently deletes your study guides, tasks and chat from this device.', resetData)} />
      </ScrollView>

      <Sheet visible={fb} title="Send Feedback" onClose={() => setFb(false)}>
        <View accessibilityRole="radiogroup" accessibilityLabel="Rating" style={{ flexDirection: 'row', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} accessibilityRole="radio" accessibilityState={{ selected: rating === n }} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`} onPress={() => { tap(); setRating(n); }} style={{ width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32, color: n <= rating ? '#F59E0B' : t.muted }}>{n <= rating ? '★' : '☆'}</Text>
            </Pressable>
          ))}
        </View>
        <P muted size={13}>{rating ? `${rating} of 5 stars` : 'Tap a star to rate'}</P>
        <Field label="Comments" value={comment} onChangeText={setComment} multiline placeholder="What's working? What could be better?" />
        {note ? <Text accessibilityRole="alert" style={{ color: t.danger }}>⚠ {note}</Text> : null}
        <Button label="Send" onPress={submit} />
      </Sheet>
    </View>
  );
}
