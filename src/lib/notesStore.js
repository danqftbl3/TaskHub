import { readJSON, writeJSON } from './storage.js';
import { uid } from './util.js';

// Only extracted text is kept (never the original file). Everything is deletable.
const MAX_CHARS = 200000;
const subs = new Set();
let notes = readJSON('notes', []);

const persist = () => { const ok = writeJSON('notes', notes); subs.forEach((f) => f(notes)); return ok; };

export const getNotes = () => notes;
export const subscribeNotes = (f) => { subs.add(f); return () => subs.delete(f); };

export function addNote({ title, subject, kind = 'text', text, fileName = '', size = 0 }) {
  const clean = String(text).trim().slice(0, MAX_CHARS);
  if (clean.length < 20) throw new Error('That looks too short to build a study guide from.');
  const note = { id: uid(), title: String(title || fileName || 'Untitled notes').trim().slice(0, 80), subject: subject || 'General', kind, text: clean, fileName, size, added: Date.now() };
  notes = [note, ...notes];
  if (!persist()) { notes = notes.slice(1); throw new Error('Not enough browser storage left. Delete some notes in Settings and try again.'); }
  return note;
}

export function removeNote(id) { notes = notes.filter((n) => n.id !== id); persist(); }
export function clearNotes() { notes = []; persist(); }
