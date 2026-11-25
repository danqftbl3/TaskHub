import { COLD_WAR_GUIDE } from '../data/coldwar.js';
import { getGuides } from '../lib/guides.js';
import { isHomeworkRequest, buildRefusal, SYSTEM_PROMPT } from './guardrail.js';

const ENV = import.meta.env || {};
const KEY = ENV.VITE_AI_API_KEY;
const MODEL = ENV.VITE_AI_MODEL || 'gemini-1.5-flash';
const BASE = ENV.VITE_AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const IS_GEMINI = BASE.includes('generativelanguage.googleapis.com');

export const aiMode = () => (KEY ? 'live' : 'offline');

const STOP = new Set('the a an of to is are was were what why how do does did and or in on for me my about explain tell can you i it this that with between mean means'.split(' '));
const words = (s) => (String(s).toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => !STOP.has(w));

/** Find the notes items most relevant to a question within one guide. */
export function findInNotes(question, guide = COLD_WAR_GUIDE) {
  const q = new Set(words(question));
  if (!q.size) return null;
  const score = (text) => words(text).filter((w) => q.has(w)).length;
  const term = guide.terms.map((t) => ({ t, s: score(t.term) * 3 + score(t.def) })).sort((a, b) => b.s - a.s)[0];
  const note = guide.notes.map((n) => ({ n, s: score(n.heading) * 2 + score(n.body) })).sort((a, b) => b.s - a.s)[0];
  const ts = term?.s >= 2 ? term.s : 0, ns = note?.s >= 2 ? note.s : 0;
  if (!ts && !ns) return null;
  return { term: ts ? term.t : null, note: ns ? note.n : null, score: ts + ns, guide };
}

/** Deterministic offline coach: step-by-step, grounded in the notes, ends with one Socratic question. */
export function offlineTutor(text, guides = [COLD_WAR_GUIDE], context = null) {
  if (/^(hi|hello|hey|yo)\b/i.test(text.trim())) {
    return { text: "I'm your TaskHub tutor. Ask about a topic in your notes and I'll guide you through it step by step. You do the writing.", steps: [] };
  }
  if (!guides.length) {
    return { text: "You haven't added any notes yet, so I have nothing from your teacher to ground an answer in. Add notes in the Study Vault and I'll explain them step by step.", steps: [{ title: 'Next step', body: 'Tap + then Upload / scan notes, or paste your notes into the Study Vault.' }] };
  }
  const search = (query) => guides.map((g) => findInNotes(query, g)).filter(Boolean).sort((a, b) => b.score - a.score)[0];
  const hit = search(text) || (context?.term ? search(`${context.term} ${text}`) : null);
  if (!hit) {
    const names = guides.slice(0, 3).map((g) => `"${g.title}"`).join(', ');
    return {
      text: `Your notes (${names}) don't seem to cover that, and I won't make up teacher content. Try asking about a key term from your notes, or add the notes that cover it.`,
      steps: [{ title: "Beyond your teacher's notes", body: 'If you want to explore it anyway, treat anything outside your notes as extra and check it against your textbook.' }],
      beyond: true,
    };
  }
  const steps = [], cite = ` [Source: ${hit.guide.title}]`;
  if (hit.term) steps.push({ title: `Step 1: ${hit.term.term}`, body: `${hit.term.def}${cite}` });
  if (hit.note) steps.push({ title: `Step ${steps.length + 1}: ${hit.note.heading}`, body: `${hit.note.body} ${hit.note.why}${cite}` });
  if (hit.term && !hit.guide.generated) steps.push({ title: `Step ${steps.length + 1}: A way to picture it`, body: hit.term.analogy });
  const t = hit.term?.term || hit.note.heading;
  steps.push({ title: `Step ${steps.length + 1}: Your turn`, question: `In your own words, how would you explain "${t}" to a friend, and where have you seen it in the notes?` });
  return { text: "Great question. Let's build it up step by step.", steps };
}

async function live(history, text, guides, context) {
  const notes = guides.map((g) => `## ${g.title}\n${g.source.lines.join('\n')}`).join('\n').slice(0, 7000);

  if (IS_GEMINI) {
    // Gemini API format
    const systemPrompt = `${SYSTEM_PROMPT}\n${context?.term ? `Current study topic: ${context.term}\n` : ''}\nTEACHER NOTES:\n${notes}`;
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...history.slice(-6).flatMap((m) => [
        { role: 'user', parts: [{ text: m.intro || m.text }] },
        { role: 'model', parts: [{ text: [m.intro || m.text, ...(m.steps || []).map((s) => [s.title, s.body, ...(s.items || []), s.question].filter(Boolean).join(' '))].filter(Boolean).join('\n') }] }
      ]),
      { role: 'user', parts: [{ text }] }
    ];
    const res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
      }),
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);
    const data = await res.json();
    const out = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!out) throw new Error('empty');
    return { text: out, steps: [] };
  }

  // OpenAI-compatible format (original)
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL, temperature: 0.4, max_tokens: 400,
      messages: [{ role: 'system', content: `${SYSTEM_PROMPT}\n${context?.term ? `Current study topic: ${context.term}\n` : ''}\nTEACHER NOTES:\n${notes}` },
        ...history.slice(-6).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: [m.intro || m.text, ...(m.steps || []).map((s) => [s.title, s.body, ...(s.items || []), s.question].filter(Boolean).join(' '))].filter(Boolean).join('\n') })),
        { role: 'user', content: text }],
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}`);
  const out = (await res.json()).choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error('empty');
  return { text: out, steps: [] };
}

/** Single entry point. The guardrail runs first and short-circuits; no model is called for homework requests. */
export async function respond(text, history = [], context = null) {
  if (isHomeworkRequest(text)) return buildRefusal(text);
  const allGuides = getGuides();
  const selected = context?.guideId && allGuides.find((guide) => guide.id === context.guideId);
  if (context?.guideId && !selected) {
    return { text: 'This study guide is no longer available. Choose Change topic to continue with your other guides.', steps: [] };
  }
  const guides = selected ? [selected] : allGuides;
  if (KEY) {
    try { return await live(history, text, guides, context); } catch (error) {
      console.error('Live tutor unavailable:', error);
      return { ...offlineTutor(text, guides, context), notice: 'Live AI is unavailable. Showing an offline response instead.' };
    }
  }
  return offlineTutor(text, guides, context);
}
