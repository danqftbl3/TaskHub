import { cap } from './notes.js';

/** Notes-driven suggestions for the Schedule view. Pure: pass in everything. */
export function getSuggestions({ guides, subjects, notes, cards = {} }) {
  const mine = guides.filter((g) => !g.demo);
  const out = [];
  for (const g of mine.slice(0, 3)) {
    const alert = g.alerts[0], term = g.terms[0];
    if (alert) out.push({ id: `alert-${g.id}`, kind: 'session', title: `Review next: ${cap(alert.text, 70)}`, detail: `Exam alert from "${g.title}" · 25 min`, label: 'Add 25-min session', session: `Review: ${cap(alert.text, 50)}` });
    else if (term) out.push({ id: `term-${g.id}`, kind: 'session', title: `Review next: ${term.term}`, detail: `Key term from "${g.title}" · 25 min`, label: 'Add 25-min session', session: `Review: ${term.term}` });
    const due = g.cards.filter((_, i) => !(cards[g.id]?.[i]?.box >= 2)).length;
    if (due) out.push({ id: `cards-${g.id}`, kind: 'link', href: `#/vault?guide=${g.id}`, title: `Practice ${due} flashcard${due > 1 ? 's' : ''}`, detail: g.title, label: 'Open flashcards' });
  }
  const covered = new Set(notes.map((n) => n.subject));
  for (const s of subjects.filter((x) => !covered.has(x)).slice(0, 2)) {
    out.push({ id: `add-${s}`, kind: 'notes', subject: s, title: `Add notes for ${s}`, detail: 'Suggestions get sharper with your own material', label: 'Add notes' });
  }
  if (!mine.length && !out.length) out.push({ id: 'first-notes', kind: 'notes', subject: '', title: 'Upload your first notes', detail: 'Get a study guide, flashcards and exam alerts from your teacher\'s material', label: 'Add notes' });
  return out.slice(0, 4);
}
