import React, { useState } from 'react';
import { Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Sheet } from '../components/Sheet';
import { Button, Field, P, success } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { extractFromAsset } from '../services/extract';

export function AddNotesSheet({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (p: { title: string; subject: string; text: string; fileName?: string }) => void }) {
  const t = useTheme();
  const [f, setF] = useState({ title: '', subject: '', text: '' });
  const [file, setFile] = useState<string | undefined>();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const reset = () => { setF({ title: '', subject: '', text: '' }); setFile(undefined); setMsg(null); };

  const pick = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ['text/plain', 'text/markdown', 'application/pdf', 'image/*'], copyToCacheDirectory: true });
      if (r.canceled || !r.assets?.[0]) return;
      const a = r.assets[0];
      const x = await extractFromAsset({ uri: a.uri, name: a.name, mimeType: a.mimeType, file: a.file });
      if (x.warning) { setMsg({ ok: false, text: x.warning }); return; }
      setFile(a.name);
      setF((p) => ({ ...p, text: x.text, title: p.title || a.name.replace(/\.[^.]+$/, '') }));
      setMsg({ ok: true, text: `Loaded ${a.name}. The text stays on this device. Review it below, then save.` });
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not read that file. Paste your notes instead.' }); }
  };

  const save = () => {
    if (f.text.trim().length < 20) return setMsg({ ok: false, text: 'Add a bit more: paste at least a couple of sentences of notes.' });
    onSave({ ...f, fileName: file }); success(); reset(); onClose();
  };

  return (
    <Sheet visible={visible} title="Add notes" onClose={onClose}>
      <Field label="Subject / Class" value={f.subject} onChangeText={(v) => setF({ ...f, subject: v })} placeholder="e.g. History" />
      <Field label="Guide Title" value={f.title} onChangeText={(v) => setF({ ...f, title: v })} placeholder="e.g. Unit 4 class notes" />
      <Field label="Notes (paste text)" value={f.text} onChangeText={(v) => setF({ ...f, text: v })} multiline placeholder="Paste your teacher's notes or transcript here…" />
      <P muted size={13}>Or pick a document (.txt, .md, .pdf). Files are read on this device only.</P>
      <Button label="Choose document" icon="📄" variant="ghost" onPress={pick} />
      {msg ? <View accessibilityRole="alert"><Text style={{ color: msg.ok ? t.accent : t.danger }}>{msg.ok ? '✓ ' : '⚠ '}{msg.text}</Text></View> : null}
      <Button label="Generate study guide" onPress={save} />
    </Sheet>
  );
}
