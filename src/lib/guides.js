import { COLD_WAR_GUIDE } from '../data/coldwar.js';
import { buildGuide } from './notes.js';
import { getNotes } from './notesStore.js';
import { getProfile } from './profile.js';

const cache = new Map();

/** The user's note-derived guides, plus the Cold War sample only if the user loaded it. */
export function getGuides() {
  let notes = [];
  try { notes = getNotes(); } catch { /* no storage */ }
  const mine = notes.map((n) => {
    const k = `${n.id}:${n.text.length}:${n.title}:${n.subject}`;
    if (!cache.has(k)) cache.set(k, buildGuide(n));
    return cache.get(k);
  });
  return getProfile().sampleLoaded ? [...mine, COLD_WAR_GUIDE] : mine;
}
