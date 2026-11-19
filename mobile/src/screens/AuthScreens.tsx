import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../context/store';
import { Button, Card, Field, H, P } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { TOUCH } from '../theme/tokens';

export type AuthStackParams = { SignUp: undefined; Login: undefined };
const LEVELS = ['High School', 'Undergraduate', 'Graduate', 'Other'];

function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  const t = useTheme(); const ins = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: ins.top + 24, paddingBottom: ins.bottom + 24, gap: 16 }}>
        <Text accessibilityRole="header" style={{ color: t.text, fontSize: 34, fontWeight: '900' }}>Task<Text style={{ color: t.primary }}>Hub</Text></Text>
        <View style={{ gap: 4 }}><H size={24}>{title}</H><P muted>{sub}</P></View>
        {children}
        <Card><P size={13} muted>Demo app: accounts are stored only on this device and passwords are hashed locally. This is not production authentication.</P></Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function SignUpScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'SignUp'>) {
  const t = useTheme(); const signUp = useStore((s) => s.signUp); const guest = useStore((s) => s.startGuest);
  const [f, setF] = useState({ name: '', email: '', password: '', level: LEVELS[0] });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); setErr((await signUp(f)) ?? ''); setBusy(false); };
  return (
    <Shell title="Study smarter, not harder" sub="Break big assignments into small wins and turn your notes into study guides.">
      <Field label="Full Name" value={f.name} onChangeText={(v) => setF({ ...f, name: v })} autoComplete="name" textContentType="name" />
      <Field label="Email" value={f.email} onChangeText={(v) => setF({ ...f, email: v })} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
      <Field label="Password (8+ characters)" value={f.password} onChangeText={(v) => setF({ ...f, password: v })} secureTextEntry textContentType="newPassword" />
      <View style={{ gap: 6 }}>
        <P size={14} style={{ fontWeight: '600' }}>Grade / Academic Level</P>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LEVELS.map((l) => {
            const on = f.level === l;
            return (
              <Pressable key={l} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={l} onPress={() => setF({ ...f, level: l })}
                style={{ minHeight: TOUCH, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 999, backgroundColor: on ? t.primary : t.highlight }}>
                <Text style={{ color: on ? t.onPrimary : t.text, fontWeight: '700' }}>{on ? '✓ ' : ''}{l}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {err ? <Text accessibilityRole="alert" style={{ color: t.danger }}>⚠ {err}</Text> : null}
      <Button label="Get Started with TaskHub" onPress={submit} disabled={busy} />
      <Button label="Guest / Try Demo" variant="ghost" onPress={guest} hint="Opens a sample workspace with Cold War demo notes" />
      <Button label="I already have an account" variant="pill" onPress={() => navigation.navigate('Login')} />
    </Shell>
  );
}

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Login'>) {
  const t = useTheme(); const { logIn, resetPassword, startGuest } = useStore();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('');
  const [forgot, setForgot] = useState(false); const [fe, setFe] = useState(''); const [fp, setFp] = useState(''); const [fm, setFm] = useState('');
  return (
    <Shell title="Welcome back" sub="Log in to pick up where you left off.">
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Field label="Password" value={pw} onChangeText={setPw} secureTextEntry />
      {err ? <Text accessibilityRole="alert" style={{ color: t.danger }}>⚠ {err}</Text> : null}
      <Button label="Log In" onPress={async () => setErr((await logIn(email, pw)) ?? '')} />
      <Button label="Forgot Password?" variant="pill" onPress={() => { setFm(''); setForgot(true); }} />
      <Button label="Guest / Try Demo" variant="ghost" onPress={startGuest} />
      <Button label="New here? Sign Up" variant="pill" onPress={() => navigation.navigate('SignUp')} />
      <Sheet visible={forgot} title="Reset password" onClose={() => setForgot(false)}>
        <P muted>There is no email server in this demo, so you can reset the password locally for an account stored on this device.</P>
        <Field label="Account email" value={fe} onChangeText={setFe} keyboardType="email-address" autoCapitalize="none" />
        <Field label="New password (8+ characters)" value={fp} onChangeText={setFp} secureTextEntry />
        {fm ? <Text accessibilityRole="alert" style={{ color: fm.startsWith('✓') ? t.accent : t.danger }}>{fm}</Text> : null}
        <Button label="Reset password" onPress={async () => { const e = await resetPassword(fe, fp); setFm(e ? `⚠ ${e}` : '✓ Password updated. You can log in now.'); }} />
      </Sheet>
    </Shell>
  );
}
