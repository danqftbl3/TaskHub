import { isHomeworkRequest, buildRefusal } from './guardrail';
import type { Guide, Refusal, RefusalStep } from '../logic/types';

export interface TutorReply { text: string; steps: RefusalStep[]; refused?: boolean; beyond?: boolean }

const STOP = new Set('the a an of to is are was were what why how do does did and or in on for me my about explain tell can you i it this that with between mean means'.split(' '));
const words = (s: string) => (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => !STOP.has(w));

function find(question: string, guide: Guide) {
  const q = new Set(words(question));
  if (!q.size) return null;
  const score = (t: string) => words(t).filter((w) => q.has(w)).length;
  const term = guide.terms.map((t) => ({ t, s: score(t.term) * 3 + score(t.def) })).sort((a, b) => b.s - a.s)[0];
  const note = guide.notes.map((n) => ({ n, s: score(n.heading) * 2 + score(n.body) })).sort((a, b) => b.s - a.s)[0];
  const ts = term && term.s >= 2 ? term.s : 0, ns = note && note.s >= 2 ? note.s : 0;
  if (!ts && !ns) return null;
  return { term: ts ? term.t : null, note: ns ? note.n : null, score: ts + ns, guide };
}

export function refusalToReply(r: Refusal): TutorReply { return { text: r.intro, steps: r.steps, refused: true }; }

/** Single entry point. The guardrail runs first and short-circuits, so no answer is ever generated for homework requests. */
export function respond(text: string, guides: Guide[]): TutorReply {
  if (isHomeworkRequest(text)) return refusalToReply(buildRefusal(text));
  if (/^(hi|hello|hey|yo)\b/i.test(text.trim())) {
    return { text: "Hi! I'm your TaskHub tutor. Ask me about a topic in your notes and I'll walk you through it step by step. I guide, you do the writing.", steps: [] };
  }
  if (!guides.length) {
    return { text: "You haven't added any notes yet, so I have nothing from your teacher to ground an answer in.", steps: [{ title: 'Next step', body: "Open the Study Vault and tap '+ Add notes' (or load the demo sample) and I'll explain them step by step." }] };
  }
  const hit = guides.map((g) => find(text, g)).filter((x): x is NonNullable<ReturnType<typeof find>> => !!x).sort((a, b) => b.score - a.score)[0];
  if (!hit) {
    return {
      text: `Your notes (${guides.slice(0, 3).map((g) => `"${g.title}"`).join(', ')}) don't seem to cover that, and I won't make up teacher content.`,
      steps: [{ title: "Beyond your teacher's notes", body: 'If you explore it anyway, treat anything outside your notes as extra and check it against your textbook.' }],
      beyond: true,
    };
  }
  const steps: RefusalStep[] = [], cite = (l: number) => `[Source line ${l} · ${hit.guide.title}]`;
  if (hit.term) steps.push({ title: `Step 1: What it means (${hit.term.term})`, body: `${hit.term.def} ${cite(hit.term.line)}` });
  if (hit.note) steps.push({ title: `Step ${steps.length + 1}: ${steps.length ? 'Why it matters' : hit.note.heading}`, body: `${hit.note.why} ${cite(hit.note.line)}` });
  const name = hit.term?.term || hit.note?.heading || 'this idea';
  steps.push({ title: `Step ${steps.length + 1}: Your turn`, question: `In your own words, how would you explain "${name}" to a friend, and where does it show up in your notes?` });
  return { text: "Great question. Let's build it up step by step.", steps };
}
