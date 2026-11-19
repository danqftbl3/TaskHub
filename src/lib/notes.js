/**
 * Deterministic, offline analysis of a student's notes -> study guide.
 * Everything is extracted from the notes themselves (each item cites a source line);
 * nothing is invented. Output shape matches src/data/coldwar.js.
 */
const STOP = new Set(('about above after again against also because been before being below between both cannot could does doing down during each from further have having here into itself just more most much must other over same should some such than that their them then there these they this those through under until very what when where which while with would your will were first second made make like many used uses using whose onto upon within without').split(' '));
const BAD_START = /^(it|this|that|these|those|they|there|he|she|we|you|i|here|which|what|when|where|who|how|why|if|in|on|at|as|and|but|so|then|also|however|note|example|remember|important|summary|tip|warning|question|answer|exam|alert)$/i;
const DEF_RE = /^(?:[Tt]he |[Aa]n? )?([A-Z][A-Za-z0-9\-'’ ]{1,40}?)\s+(?:\(([A-Z]{2,8})\)\s+)?(is|are|was|were|means|refers to|is defined as|are defined as|describes|is called|are called|is known as)\s+(.{10,})$/;
const COLON_RE = /^([A-Z][A-Za-z0-9\-'’ ]{1,40}?):\s+(.{10,})$/;
const SENT_SPLIT = /(?<=[.!?])\s+(?=[A-Z0-9"“(\[])/;
const CAUSAL = /because|therefore|so that|as a result|led to|caused|which means|this made|since |due to/i;

export const cap = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function splitLines(text, max = 800) {
  const out = [];
  for (const raw of String(text).replace(/\r/g, '').split('\n')) {
    const line = raw.replace(/^\s*(?:[-*•▪]|\d+[.)])\s+/, '').replace(/\s+/g, ' ').trim();
    if (!line) continue;
    for (const s of line.split(SENT_SPLIT)) {
      const t = s.trim();
      if (t.length >= 12) out.push(t);
      if (out.length >= max) return out;
    }
  }
  return out;
}

function extractTerms(lines) {
  const seen = new Set(), terms = [];
  const add = (t) => { seen.add(t.term.toLowerCase()); terms.push(t); };
  const known = (name) => [...seen].some((s) => s === name.toLowerCase() || s.includes(name.toLowerCase()) || name.toLowerCase().includes(s));

  lines.forEach((l, i) => {
    if (terms.length >= 6) return;
    let term, def;
    const m = l.match(DEF_RE);
    if (m) {
      term = m[1].trim(); def = l;
      const words = term.split(/\s+/);
      if (words.length > 4 || BAD_START.test(words[0]) || (/^(was|were)$/.test(m[3]) && words.length < 2)) term = '';
    } else {
      const c = l.match(COLON_RE);
      if (c) { term = c[1].trim(); def = l; if (term.split(/\s+/).length > 5 || BAD_START.test(term.split(/\s+/)[0])) term = ''; }
    }
    if (term && !known(term)) add({ term, line: i + 1, def: cap(def, 240), mention: false });
  });

  const counts = new Map();
  for (const l of lines) {
    for (const mm of l.matchAll(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,2}\b/g)) {
      let ws = mm[0].split(/\s+/);
      while (ws.length && (BAD_START.test(ws[0]) || /^the$/i.test(ws[0]))) ws = ws.slice(1);
      if (ws.length >= 2) { const p = ws.join(' '); counts.set(p, (counts.get(p) || 0) + 2); }
    }
  }
  const freq = new Map();
  for (const w of lines.join(' ').toLowerCase().match(/[a-z]{5,}/g) || []) if (!STOP.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
  for (const [w, n] of freq) if (n >= 3) counts.set(w[0].toUpperCase() + w.slice(1), n);

  [...counts].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).forEach(([name]) => {
    if (terms.length >= 8 || known(name)) return;
    const idx = lines.findIndex((l) => new RegExp(esc(name), 'i').test(l));
    if (idx >= 0) add({ term: name, line: idx + 1, def: cap(lines[idx], 240), mention: true });
  });

  return terms.map((t) => {
    const re = new RegExp(esc(t.term), 'i');
    const hits = lines.map((l, i) => [l, i + 1]).filter(([l]) => re.test(l));
    const ex = hits.find(([l, n]) => n !== t.line && /for example|e\.g\.|such as|for instance/i.test(l));
    return {
      ...t,
      example: ex ? cap(ex[0], 200) : '',
      analogy: t.def,
      academic: hits.slice(0, 3).map(([l]) => cap(l, 220)).join('  ') || t.def,
    };
  });
}

function extractAlerts(lines) {
  const out = [];
  lines.forEach((l, i) => {
    let e = 0;
    if (/exam alert|will be on (?:the )?(?:exam|test)|definitely|must know|guaranteed/i.test(l)) e = 3;
    else if (/\b(exam|test|quiz|midterm|expect|favou?rite|asked)\b/i.test(l)) e = 2;
    else if (/\b(important|remember|key point|essential|don'?t forget|note that|pay attention)\b/i.test(l)) e = 1;
    if (!e) return;
    const m = l.match(/EXAM ALERT:?\s*(.+)$/i);
    out.push({ text: cap((m ? m[1] : l).trim(), 200), emphasis: e, line: i + 1 });
  });
  return out.sort((a, b) => b.emphasis - a.emphasis || a.line - b.line).slice(0, 6);
}

const extractMistakes = (lines) => lines
  .map((l, i) => ({ text: cap(l, 200), line: i + 1, hit: /common mistake|\bdo not\b|\bdon'?t\b|\bnever\b|\bavoid\b|confus|mix up|not the same|\bcareful\b|\bincorrect\b|\bwrong\b/i.test(l) }))
  .filter((x) => x.hit).slice(0, 4).map(({ text, line }) => ({ text, line }));

function extractTakeaways(lines, terms, alerts) {
  const pick = new Set(lines.length ? [1] : []);
  terms.filter((t) => !t.mention).slice(0, 3).forEach((t) => pick.add(t.line));
  alerts.slice(0, 2).forEach((a) => pick.add(a.line));
  for (let n = 2; pick.size < Math.min(3, lines.length) && n <= lines.length; n++) pick.add(n);
  return [...pick].sort((a, b) => a - b).slice(0, 5).map((n) => ({ text: cap(lines[n - 1], 170), line: n }));
}

function sectionize(lines, terms) {
  const out = [];
  for (let i = 0; i < lines.length && out.length < 12; i += 3) {
    const chunk = lines.slice(i, i + 3), joined = chunk.join(' ');
    const t = terms.find((x) => joined.toLowerCase().includes(x.term.toLowerCase()));
    const causal = chunk.find((l) => CAUSAL.test(l));
    out.push({
      heading: t ? t.term : `${chunk[0].split(/\s+/).slice(0, 6).join(' ')}…`,
      line: i + 1,
      body: cap(joined, 450),
      why: causal ? cap(causal, 220) : 'The source does not explain the reason here. Ask the Tutor to explore it.',
    });
  }
  return out;
}

function makeCards(lines, terms) {
  const cards = terms.filter((t) => !t.mention).map((t) => ({ q: `What is ${t.term}?`, a: cap(t.def, 240), line: t.line }));
  for (const t of terms) {
    if (cards.length >= 12) break;
    const re = new RegExp(esc(t.term), 'i');
    const idx = lines.findIndex((l, i) => i + 1 !== t.line && l.length >= 30 && l.length <= 200 && re.test(l));
    if (idx >= 0) cards.push({ q: `Fill in the blank: ${lines[idx].replace(re, '_____')}`, a: t.term, line: idx + 1 });
  }
  return cards.slice(0, 12);
}

export function buildGuide(note) {
  const lines = splitLines(note.text);
  const terms = extractTerms(lines), alerts = extractAlerts(lines);
  return {
    id: `note-${note.id}`, noteId: note.id, title: note.title, subject: note.subject, generated: true,
    teacher: 'Your uploaded notes', source: { name: note.fileName || note.title, lines },
    takeaways: extractTakeaways(lines, terms, alerts), notes: sectionize(lines, terms), terms, alerts,
    mistakes: extractMistakes(lines), beyond: [], cards: makeCards(lines, terms),
  };
}
