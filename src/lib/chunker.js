import { addDays, daysBetween, dayKey, parseDay, uid } from './util.js';

// Deterministic task-type templates: [phase title, weight]
const TEMPLATES = {
  writing: { base: 150, words: ['essay', 'paper', 'report', 'write', 'writing', 'thesis', 'article', 'review', 'analysis', 'dbq'],
    phases: [['Understand the prompt & gather sources', 2], ['Research and take notes', 3], ['Build a thesis and outline', 2], ['Draft the body sections', 4], ['Draft intro & conclusion', 2], ['Revise for argument and evidence', 2], ['Proofread and check citations', 1]] },
  problems: { base: 90, words: ['worksheet', 'problem', 'problems', 'questions', 'exercises', 'homework', 'practice', 'equations', 'math', 'chemistry', 'physics'],
    phases: [['Review the relevant notes and examples', 1], ['Work through the first set of problems', 2], ['Work through the next set of problems', 2], ['Tackle the hardest problems', 2], ['Check your work and fix mistakes', 1]] },
  project: { base: 180, words: ['project', 'presentation', 'slides', 'poster', 'model', 'build', 'lab', 'experiment', 'portfolio'],
    phases: [['Define scope and plan the pieces', 1], ['Research and collect materials', 3], ['Build the first part', 3], ['Build the remaining parts', 3], ['Assemble and polish', 2], ['Rehearse or test and finalize', 1]] },
  reading: { base: 75, words: ['read', 'reading', 'chapter', 'chapters', 'book', 'novel', 'pages', 'textbook'],
    phases: [['Preview headings and set questions', 1], ['Read the first part and annotate', 3], ['Read the rest and annotate', 3], ['Summarize key ideas in your own words', 1]] },
  study: { base: 120, words: ['exam', 'test', 'quiz', 'midterm', 'final', 'study', 'revise', 'revision'],
    phases: [['List topics and gather materials', 1], ['Review topic notes', 3], ['Make flashcards or a cheat-sheet', 2], ['Practice recall without notes', 3], ['Do a timed self-check', 2]] },
};
const GENERIC = { base: 100, phases: [['Understand what is being asked', 1], ['Gather what you need', 1], ['Do the first main part', 3], ['Do the next main part', 3], ['Review and finish', 1]] };

const tokens = (s) => (String(s).toLowerCase().match(/[a-z]+/g) || []);

export function detectType(text) {
  const t = tokens(text);
  let best = null, bestN = 0;
  for (const [k, v] of Object.entries(TEMPLATES)) {
    const n = t.filter((w) => v.words.includes(w)).length;
    if (n > bestN) { best = k; bestN = n; }
  }
  return best;
}

/** Estimated total minutes from type, size hints (pages/words/questions) and description length. */
export function estimateMinutes(title, description) {
  const text = `${title} ${description}`;
  const tpl = TEMPLATES[detectType(text)] || GENERIC;
  let total = tpl.base;
  const num = (re) => { const m = text.toLowerCase().match(re); return m ? Number(m[1]) : 0; };
  const pages = num(/(\d+)\s*(?:-|\s)?\s*pages?/), words = num(/(\d{3,5})\s*words?/), qs = num(/(\d+)\s*(?:questions|problems|exercises)/);
  if (pages) total = Math.max(total, pages * 40);
  if (words) total = Math.max(total, (words / 500) * 45 + 60);
  if (qs) total = Math.max(total, qs * 6 + 30);
  total += Math.min(60, Math.floor(String(description).trim().split(/\s+/).filter(Boolean).length / 20) * 10);
  return Math.min(600, Math.max(60, Math.round(total / 5) * 5));
}

/** Split into 20-40 minute sessions. Returns [{id,title,minutes}] (no dates yet). */
export function chunk(title, description = '', target = 30) {
  const text = `${title} ${description}`;
  const tpl = TEMPLATES[detectType(text)] || GENERIC;
  const total = estimateMinutes(title, description);
  const weightSum = tpl.phases.reduce((a, p) => a + p[1], 0);
  const steps = [];
  for (const [label, w] of tpl.phases) {
    const m = (total * w) / weightSum;
    const n = Math.max(1, Math.round(m / target));
    const per = Math.min(40, Math.max(20, Math.round(m / n / 5) * 5));
    for (let i = 0; i < n; i++) {
      steps.push({ id: uid(), title: n > 1 ? `${label} (${i + 1}/${n})` : label, minutes: per, day: null, done: false, doneAt: null });
    }
  }
  return steps;
}

/**
 * Assign days to undone steps, spreading them evenly from `from` to the day before the due date
 * (or just `from` when due is today/past). Done steps keep their day.
 */
export function schedule(steps, due, from = dayKey()) {
  const lastDay = daysBetween(from, due) >= 1 ? addDays(due, -1) : from;
  const span = daysBetween(from, lastDay) + 1;
  const open = steps.filter((s) => !s.done);
  open.forEach((s, i) => { s.day = addDays(from, Math.floor((i * span) / open.length)); });
  return steps;
}

export const makeAssignment = ({ title, description = '', due, target = 30 }, today = dayKey()) => ({
  id: uid(), title: title.trim(), description: description.trim(), due, created: today,
  steps: schedule(chunk(title, description, target), due, today),
});

/** A single review session today (used by notes-based suggestions). */
export const quickSession = (title, minutes = 25, today = dayKey()) => ({
  id: uid(), title, description: '', due: addDays(today, 1), created: today,
  steps: [{ id: uid(), title: 'Focused review', minutes, day: today, done: false, doneAt: null }],
});

/** Rebalance: any open step scheduled before today (falling behind) triggers a replan from today. */
export const replan = (a, today = dayKey()) => {
  schedule(a.steps, a.due, today);
  return a;
};

export function reschedule(a, from, today = dayKey()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || dayKey(parseDay(from)) !== from) return false;
  const lastStart = a.due > today ? a.due : today;
  if (from < today || from > lastStart || !a.steps.some((step) => !step.done)) return false;
  schedule(a.steps, a.due, from);
  return true;
}

export const progress = (a) => {
  const t = a.steps.reduce((s, x) => s + x.minutes, 0), d = a.steps.filter((x) => x.done).reduce((s, x) => s + x.minutes, 0);
  return t ? (d / t) * 100 : 0;
};

/** Consecutive days (ending today, or yesterday if nothing yet today) with at least one completed step. */
export function streak(assignments, today = dayKey()) {
  const days = new Set(assignments.flatMap((a) => a.steps.filter((s) => s.done && s.doneAt).map((s) => s.doneAt)));
  let d = days.has(today) ? today : addDays(today, -1), n = 0;
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
