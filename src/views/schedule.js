import { getState, subscribe, toggleStep, addAssignment } from '../lib/store.js';
import { dayKey, daysBetween, esc, fmtDay, ring, buzz } from '../lib/util.js';
import { streak, quickSession } from '../lib/chunker.js';
import { stepRow, keepFocus } from './shared.js';
import { openAssignmentModal } from './modal.js';
import { openNotesModal } from './notesModal.js';
import { getGuides } from '../lib/guides.js';
import { getNotes, subscribeNotes } from '../lib/notesStore.js';
import { getProfile, subscribeProfile } from '../lib/profile.js';
import { getSuggestions } from '../lib/suggest.js';
import { readJSON } from '../lib/storage.js';
import { openFocusTimer } from './timer.js';

export function initSchedule(root, { toast, onStep }) {
  const slot = root.querySelector('[data-slot]');
  slot.className = 'schedule';

  let SUGG = [];
  function render() {
    const today = dayKey(), { assignments } = getState();
    const all = assignments.flatMap((a) => a.steps.map((s) => ({ a, s })));
    const todays = all.filter(({ s }) => s.day === today || (s.done && s.doneAt === today));
    const uniq = [...new Map(todays.map((x) => [x.s.id, x])).values()];
    const doneMin = uniq.filter((x) => x.s.done).reduce((n, x) => n + x.s.minutes, 0);
    const totalMin = uniq.reduce((n, x) => n + x.s.minutes, 0);
    const pct = totalMin ? (doneMin / totalMin) * 100 : 0;
    const st = streak(assignments, today);
    const upcoming = all.filter(({ s }) => !s.done && daysBetween(today, s.day) > 0)
      .sort((x, y) => x.s.day.localeCompare(y.s.day)).slice(0, 4);

    const titles = new Set(assignments.map((a) => a.title));
    let sugg = [];
    try { sugg = getSuggestions({ guides: getGuides(), subjects: getProfile().subjects, notes: getNotes(), cards: readJSON('cards', {}) }).filter((x) => x.kind !== 'session' || !titles.has(x.session)); } catch { /* ignore */ }
    SUGG = sugg;
    const suggHtml = sugg.length ? `<h2 class="section-title">Suggested for you</h2><ul class="card sugg">${sugg.map((x, i) => `<li><div><strong>${esc(x.title)}</strong><span class="step-meta">${esc(x.detail)}</span></div><button class="btn ghost sm" type="button" data-sugg="${i}">${esc(x.label)}</button></li>`).join('')}</ul>` : '';
    slot.innerHTML = (!assignments.length ? `
      <div class="card empty">
        <h2>Nothing planned yet</h2>
        <p>Add an assignment and TaskHub will split it into 20–40 minute sessions across the days before it's due.</p>
        <button class="btn primary" data-add>Add your first assignment</button>
      </div>` : `
      <div class="card hero">
        ${ring(pct, 128, "Today's progress")}
        <div class="hero-text">
          <h2>${uniq.length ? (pct >= 100 ? 'All done for today' : "Today's focus") : 'Free day'}</h2>
          <p>${uniq.length ? `${uniq.filter((x) => x.s.done).length} of ${uniq.length} sessions · ${doneMin}/${totalMin} min` : 'No sessions planned. Rest up or get ahead.'}</p>
          <p class="streak-line"><strong>${st}</strong>-day streak${st ? '' : ' · finish a session to start one'}</p>
        </div>
      </div>
      <h2 class="section-title">Today's agenda</h2>
      ${uniq.length ? `<ul class="card steps" aria-label="Today's sessions">${uniq.map((x) => stepRow(x.a, x.s, true)).join('')}</ul>` : '<p class="muted">Nothing scheduled today.</p>'}
      ${upcoming.length ? `<h2 class="section-title">Coming up</h2>
        <ul class="card steps muted-steps">${upcoming.map(({ a, s }) => `<li class="upnext"><span class="chip">${fmtDay(s.day, today)}</span> ${esc(s.title)} <span class="step-meta">· ${s.minutes} min · ${esc(a.title)}</span></li>`).join('')}</ul>` : ''}
      <button class="btn ghost" data-add>Add assignment</button>`) + suggHtml;
  }

  slot.addEventListener('change', (e) => {
    const cb = e.target.closest('input[data-sid]');
    if (!cb) return;
    const s = toggleStep(cb.dataset.aid, cb.dataset.sid);
    if (s?.done) { buzz([15, 40, 15]); onStep?.(s); }
  });
  slot.addEventListener('click', (e) => {
    if (e.target.closest('[data-add]')) return openAssignmentModal({ toast });
    const focus = e.target.closest('[data-focus-sid]');
    if (focus) return openFocusTimer({ toast, assignmentId: focus.dataset.focusAid, stepId: focus.dataset.focusSid });
    const b = e.target.closest('[data-sugg]');
    if (!b) return;
    const x = SUGG[Number(b.dataset.sugg)];
    if (x.kind === 'session') { addAssignment(quickSession(x.session, 25)); toast('Session added to today'); }
    else if (x.kind === 'link') location.hash = x.href;
    else openNotesModal({ subject: x.subject, toast });
  });
  subscribe(() => keepFocus(slot, render)); subscribeNotes(render); subscribeProfile(render);
  render();
}
