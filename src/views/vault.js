import { getGuides } from '../lib/guides.js';
import { subscribeNotes } from '../lib/notesStore.js';
import { getProfile, updateProfile, subscribeProfile } from '../lib/profile.js';
import { readJSON, writeJSON } from '../lib/storage.js';
import { openNotesModal } from './notesModal.js';
import { esc, buzz } from '../lib/util.js';
import { mountTutorChat, setTutorContext } from './tutorChat.js';

const load = () => readJSON('cards', {});
const save = (v) => writeJSON('cards', v);

const EMPH = { 3: 'Must know', 2: 'Likely', 1: 'Noted' };
const srcLink = (n) => `<a class="src" href="#src-${n}" data-src="${n}">View source</a>`;

export function initVault(root, { toast }) {
  const slot = root.querySelector('[data-slot]');
  slot.className = 'vault';
  const st = { detail: 'standard', q: '', card: 0, flipped: false, mode: 'analogy', gid: null, subj: 'All' };
  let quiz = { index: 0, revealed: false, correct: 0, answer: '' };
  let all = [], G = null, progress = load();
  const gp = () => (progress[G.id] ||= {});
  const hashGuide = () => (location.hash.match(/guide=([\w-]+)/) || [])[1];
  function pick() {
    all = getGuides();
    const want = hashGuide() || st.gid;
    const g = all.find((x) => x.id === want) || all[0];
    if (!g) { G = null; st.gid = null; return; }
    if (g.id !== st.gid) { st.gid = g.id; st.card = 0; st.flipped = false; quiz = { index: 0, revealed: false, correct: 0, answer: '' }; }
    G = g;
  }

  const matches = (...t) => !st.q || t.join(' ').toLowerCase().includes(st.q.toLowerCase());

  function render() {
    pick();
    const f = document.activeElement?.id;
    if (!G) {
      slot.innerHTML = `<div class="card empty">
        <h2>Your Study Vault is empty</h2>
        <p>Upload or paste your teacher's notes and TaskHub will build a study guide with key terms, exam alerts, common mistakes and flashcards, using only what's in your notes.</p>
        <button class="btn primary" type="button" id="v-add">Upload your first notes</button>
        <button class="btn ghost" type="button" id="v-sample">Load sample demo notes</button></div>`;
      return;
    }
    const subjects = ['All', ...new Set(all.map((g) => g.subject))];
    const list = all.filter((g) => st.subj === 'All' || g.subject === st.subj);
    const alerts = [...G.alerts].sort((a, b) => b.emphasis - a.emphasis).filter((a) => matches(a.text));
    const terms = G.terms.filter((t) => matches(t.term, t.def));
    const cards = G.cards;
    const c = cards.length ? cards[st.card % cards.length] : null;
    const quizCards = cards.slice(0, 5), quizCard = quizCards[quiz.index];
    const known = cards.filter((_, i) => gp()[i]?.box >= 2).length;
    const d = st.detail;
    const shownTakeaways = d === 'summary' ? G.takeaways.slice(0, 3) : G.takeaways;
    const shownAlerts = d === 'summary' ? alerts.slice(0, 3) : alerts;
    const shownTerms = d === 'summary' ? terms.slice(0, 3) : terms;
    slot.innerHTML = `
      <div class="row between"><div class="chips" role="group" aria-label="Filter by subject">${subjects.map((s) => `<button type="button" class="pill" data-subj="${esc(s)}" aria-pressed="${st.subj === s}">${esc(s)}</button>`).join('')}</div>
        <button class="btn primary sm" type="button" id="v-add">＋ Add notes</button></div>
      <label class="field"><span>Guide</span><select id="v-guide">${list.map((g) => `<option value="${esc(g.id)}" ${g.id === G.id ? 'selected' : ''}>${esc(g.title)} (${esc(g.subject)})</option>`).join('')}</select></label>
      <div class="card guide-head">
        <span class="chip">${esc(G.subject)}</span>
        <h2>${esc(G.title)}</h2>
        <p class="step-meta">${G.generated ? 'Built from your uploaded notes' : `From: ${esc(G.teacher)}`}</p>
        <label class="search"><span class="sr-only">Search the vault</span>
          <input id="v-search" type="search" placeholder="Search terms and alerts" value="${esc(st.q)}" /></label>
        <div class="seg" role="group" aria-label="Detail level">
          ${['summary', 'standard', 'deep'].map((x) => `<button type="button" data-detail="${x}" aria-pressed="${d === x}">${{ summary: 'Summary', standard: 'Standard', deep: 'Deep dive' }[x]}</button>`).join('')}
        </div>
        <p class="step-meta guide-detail">${{ summary: 'A short overview of the main points', standard: 'Key points, terms and explained notes', deep: 'The full guide with related source passages' }[d]}</p>
      </div>

      <h2 class="section-title">Quick takeaways</h2>
      <ul class="card bullets">${shownTakeaways.map((t) => `<li>${esc(t.text)} ${srcLink(t.line)}</li>`).join('') || '<li class="muted">Add a little more text to get takeaways.</li>'}</ul>

      <h2 class="section-title">Exam alerts</h2>
      <ul class="alerts">${shownAlerts.map((a) => `<li class="alert e${a.emphasis}"><span class="badge" title="Teacher emphasis">${EMPH[a.emphasis]}</span><span>${esc(a.text)} ${srcLink(a.line)}</span></li>`).join('') || `<li class="muted">${G.alerts.length ? 'No matching alerts.' : 'No exam hints (like "important", "exam" or "remember") were spotted.'}</li>`}</ul>

      <h2 class="section-title">Teacher key terms</h2>
      <div class="terms">${shownTerms.map((t) => `<button class="term" type="button" data-term="${esc(t.term)}" aria-haspopup="dialog"><strong>${esc(t.term)}</strong><span>${esc(t.def)}</span><em>Open Deep Explainer</em></button>`).join('') || `<p class="muted">${G.terms.length ? 'No matching terms.' : 'No definitions ("X is…", "X means…") were spotted.'}</p>`}</div>

      ${d !== 'summary' ? `<h2 class="section-title">Explained notes</h2>
        ${G.notes.map((n) => `<article class="card note"><h3>${esc(n.heading)} ${srcLink(n.line)}</h3><p>${esc(n.body)}</p>
          ${d === 'deep' ? `<p class="why"><strong>Why it matters:</strong> ${esc(n.why)}</p><details class="guide-source"><summary>Related source passage</summary><p>${esc(G.source.lines.slice(n.line - 1, n.line + (G.generated ? 2 : 0)).join(' '))}</p></details>` : ''}</article>`).join('')}
        <h2 class="section-title">Common mistakes</h2>
        <ul class="card bullets warn">${G.mistakes.map((m) => `<li><span class="sr-only">Mistake: </span>✗ ${esc(m.text)} ${srcLink(m.line)}</li>`).join('') || '<li class="muted">Not found in your notes: your teacher didn\'t flag any common mistakes here.</li>'}</ul>` : ''}

      ${d === 'deep' && G.beyond.length ? `<h2 class="section-title">Beyond your teacher's notes</h2>
        <ul class="card bullets beyond">${G.beyond.map((b) => `<li><span class="chip outline">Beyond your teacher's notes</span> ${esc(b.text)}</li>`).join('')}</ul>` : ''}

      <h2 class="section-title">Flashcards <span class="step-meta">· ${known}/${cards.length} mastered</span></h2>
      ${!c ? '<p class="muted">Your notes were too short to make flashcards. Add more detail.</p>' : `<div class="deck">
        <button class="flash ${st.flipped ? 'flipped' : ''}" id="flash" type="button" aria-label="Flashcard ${st.card + 1} of ${cards.length}. ${st.flipped ? 'Answer shown' : 'Question shown'}. Press to flip.">
          <span class="face front"><small>Question · ${st.card + 1}/${cards.length}</small>${esc(c.q)}<small class="hint">Tap or press Enter to flip</small></span>
          <span class="face back"><small>Answer</small>${esc(c.a)}</span>
        </button>
        <div class="deck-actions">
          <button class="btn ghost" data-nav="-1" aria-label="Previous card">← Prev</button>
          <button class="btn ghost" data-grade="0" ${st.flipped ? '' : 'disabled'}>↺ Again</button>
          <button class="btn primary" data-grade="1" ${st.flipped ? '' : 'disabled'}>✓ Got it</button>
          <button class="btn ghost" data-nav="1" aria-label="Next card">Next →</button>
        </div>
      </div>`}

      <h2 class="section-title">Practice quiz</h2>
      ${!quizCards.length ? '<p class="muted">Add notes with definitions to make practice questions.</p>' : `<section class="card quiz" aria-label="Practice quiz">
        ${quizCard ? `<p class="step-meta">Question ${quiz.index + 1} of ${quizCards.length}</p>
          <h3>${esc(quizCard.q)}</h3>
          <label class="field"><span>Your answer</span><textarea id="quiz-answer" rows="3" ${quiz.revealed ? 'readonly' : ''}>${esc(quiz.answer)}</textarea></label>
          ${quiz.revealed ? `<div class="quiz-answer"><strong>Answer from your notes</strong><p>${esc(quizCard.a)} ${srcLink(quizCard.line)}</p></div>
            <p class="step-meta">How did you do?</p><div class="quiz-actions"><button class="btn ghost" type="button" data-quiz-grade="0">Review again</button><button class="btn primary" type="button" data-quiz-grade="1">Got it</button></div>`
            : '<button class="btn primary" type="button" data-quiz-reveal>Show answer</button>'}`
          : `<h3>Quiz complete</h3><p>You marked ${quiz.correct} of ${quizCards.length} answers as understood.</p><button class="btn ghost" type="button" data-quiz-restart>Try again</button>`}
      </section>`}

      <h2 class="section-title">Source: ${esc(G.source.name)}</h2>
      <ul class="card source">${G.source.lines.map((l, i) => `<li id="src-${i + 1}">${esc(l)}</li>`).join('')}</ul>
      <button class="btn ghost" id="v-gone" type="button">Delete saved flashcard progress</button>
      ${getProfile().sampleLoaded ? '<button class="btn ghost" type="button" id="v-sample">Remove sample demo notes</button>' : '<button class="btn ghost" type="button" id="v-sample">Load sample demo notes</button>'}`;
    if (f) document.getElementById(f)?.focus();
  }

  const drawer = document.createElement('dialog');
  drawer.className = 'modal drawer';
  document.body.append(drawer);
  let unmountChat;
  drawer.addEventListener('close', () => { unmountChat?.(); unmountChat = null; });
  drawer.addEventListener('click', (e) => { if (e.target === drawer || e.target.closest('[data-close]')) drawer.close(); });
  function openTerm(name) {
    const t = G.terms.find((x) => x.term === name);
    if (!t) return;
    setTutorContext({ guideId: G.id, title: G.title, term: t.term });
    drawer.setAttribute('aria-label', `Deep Explainer: ${t.term}`);
    drawer.innerHTML = `<div class="modal-form"><div class="modal-head"><h2>${esc(t.term)}</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
        <div class="seg" role="group" aria-label="Explanation style">
          <button type="button" data-mode="analogy">Key idea</button>
          <button type="button" data-mode="academic">Detailed view</button></div>
        <p class="explain" aria-live="polite"></p>
        ${t.example ? `<p class="step-meta"><strong>Example:</strong> ${esc(t.example)}</p>` : ''}
        <p class="step-meta">${srcLink(t.line)}</p>
        <h3>Ask the tutor</h3><div class="chat-body explainer-chat"></div></div>`;
    const show = () => {
      drawer.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === st.mode)));
      drawer.querySelector('.explain').textContent = st.mode === 'analogy' ? t.def : t.academic;
    };
    show();
    drawer.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { st.mode = b.dataset.mode; show(); }));
    drawer.querySelector('[data-src]').addEventListener('click', () => drawer.close());
    unmountChat = mountTutorChat(drawer.querySelector('.explainer-chat'), { compact: true });
    if (!drawer.open) drawer.showModal();
  }

  const flip = () => { st.flipped = !st.flipped; buzz(8); render(); };
  slot.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('#flash')) return flip();
    const sj = t.closest('[data-subj]'); if (sj) { st.subj = sj.dataset.subj; const f = all.find((g) => st.subj === 'All' || g.subject === st.subj); if (f) { st.gid = null; history.replaceState(null, '', `#/vault?guide=${f.id}`); } return render(); }
    if (t.closest('#v-add')) return openNotesModal({ toast });
    if (t.closest('#v-sample')) {
      const on = !getProfile().sampleLoaded;
      st.gid = null;
      history.replaceState(null, '', on ? '#/vault?guide=cold-war-demo' : '#/vault');
      updateProfile({ sampleLoaded: on });
      return toast(on ? 'Sample Cold War notes loaded' : 'Sample notes removed');
    }
    const dt = t.closest('[data-detail]'); if (dt) { st.detail = dt.dataset.detail; return render(); }
    if (t.closest('[data-quiz-reveal]')) { quiz.revealed = true; render(); slot.querySelector('[data-quiz-grade]')?.focus(); return; }
    const quizGrade = t.closest('[data-quiz-grade]');
    if (quizGrade) { quiz.correct += Number(quizGrade.dataset.quizGrade); quiz.index++; quiz.revealed = false; quiz.answer = ''; render(); slot.querySelector('#quiz-answer, [data-quiz-restart]')?.focus(); return; }
    if (t.closest('[data-quiz-restart]')) { quiz = { index: 0, revealed: false, correct: 0, answer: '' }; render(); slot.querySelector('#quiz-answer')?.focus(); return; }
    const tm = t.closest('[data-term]'); if (tm) return openTerm(tm.dataset.term);
    const nv = t.closest('[data-nav]');
    if (nv) { const n = G.cards.length; st.card = (st.card + Number(nv.dataset.nav) + n) % n; st.flipped = false; return render(); }
    const gr = t.closest('[data-grade]');
    if (gr) {
      const i = st.card % G.cards.length, box = gp()[i]?.box || 0;
      gp()[i] = { box: gr.dataset.grade === '1' ? Math.min(3, box + 1) : 0, at: Date.now() };
      save(progress); buzz(gr.dataset.grade === '1' ? [10, 30, 10] : 25);
      toast(gr.dataset.grade === '1' ? 'Card saved for later review' : 'Card will return for review');
      st.card = (st.card + 1) % G.cards.length; st.flipped = false; return render();
    }
    const src = t.closest('[data-src]');
    if (src) {
      e.preventDefault();
      const li = document.getElementById(`src-${src.dataset.src}`);
      li?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      li?.classList.remove('hl'); void li?.offsetWidth; li?.classList.add('hl');
    }
    if (t.closest('#v-gone') && confirm('Delete saved flashcard progress?')) { delete progress[G.id]; save(progress); render(); toast('Progress deleted'); }
  });
  slot.addEventListener('change', (e) => { if (e.target.id === 'v-guide') { history.replaceState(null, '', `#/vault?guide=${e.target.value}`); st.gid = null; render(); } });
  slot.addEventListener('input', (e) => { if (e.target.id === 'quiz-answer') quiz.answer = e.target.value; if (e.target.id === 'v-search') { st.q = e.target.value; const pos = e.target.selectionStart; render(); const i = document.getElementById('v-search'); i.focus(); i.setSelectionRange(pos, pos); } });
  drawer.addEventListener('click', (e) => { const s = e.target.closest('[data-src]'); if (s) { e.preventDefault(); setTimeout(() => document.getElementById(`src-${s.dataset.src}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); } });
  subscribeNotes(() => { st.gid = null; render(); });
  subscribeProfile(() => render());
  addEventListener('hashchange', () => { if (hashGuide() && hashGuide() !== st.gid) render(); });
  render();
}
