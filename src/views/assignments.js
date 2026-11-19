import { getState, subscribe, toggleStep, removeAssignment, rescheduleAssignment } from '../lib/store.js';
import { dayKey, esc, fmtDay, ring, buzz } from '../lib/util.js';
import { progress } from '../lib/chunker.js';
import { stepRow, dueLabel, keepFocus } from './shared.js';
import { openAssignmentModal } from './modal.js';

const open = new Set();

export function initAssignments(root, { toast, onStep }) {
  const slot = root.querySelector('[data-slot]');
  slot.className = 'assignments';

  function render() {
    const today = dayKey(), { assignments } = getState();
    if (!assignments.length) {
      slot.innerHTML = `<div class="card empty"><h2>No assignments</h2>
        <p>Tap below to add one. It gets chunked into bite-size sessions automatically.</p>
        <button class="btn primary" data-add>Add assignment</button></div>`;
      return;
    }
    slot.innerHTML = assignments.map((a) => {
      const done = a.steps.filter((s) => s.done).length, p = progress(a);
      const byDay = new Map();
      a.steps.forEach((s) => byDay.set(s.day, [...(byDay.get(s.day) || []), s]));
      const isOpen = open.has(a.id);
      return `<article class="card assign" data-id="${a.id}">
        <div class="assign-head">
          ${ring(p, 72, esc(a.title) + ' progress')}
          <div class="assign-info">
            <h2>${esc(a.title)}</h2>
            <p class="step-meta">${dueLabel(a, today)} · ${done}/${a.steps.length} sessions · ${a.steps.reduce((n, s) => n + s.minutes, 0)} min total</p>
          </div>
        </div>
        <div class="assign-actions">
          <button class="btn ghost sm" data-toggle="${a.id}" aria-expanded="${isOpen}">${isOpen ? 'Hide' : 'Show'} steps</button>
          <button class="btn ghost sm danger" data-del="${a.id}" aria-label="Delete ${esc(a.title)}">Delete</button>
        </div>
        ${done < a.steps.length ? `<form class="reschedule" data-reschedule="${a.id}">
          <label class="field"><span>Reschedule remaining sessions from</span><input type="date" name="from" min="${today}" max="${a.due > today ? a.due : today}" value="${a.rescheduleFrom > today ? a.rescheduleFrom : today}" required /></label>
          <button class="btn ghost sm" type="submit">Reschedule</button>
        </form>` : ''}
        ${isOpen ? [...byDay].map(([day, ss]) => `<h3 class="day-head">${fmtDay(day, today)}</h3><ul class="steps">${ss.map((s) => stepRow(a, s)).join('')}</ul>`).join('') : ''}
      </article>`;
    }).join('') + '<button class="btn ghost" data-add>Add assignment</button>';
  }

  slot.addEventListener('change', (e) => {
    const cb = e.target.closest('input[data-sid]');
    if (!cb) return;
    const s = toggleStep(cb.dataset.aid, cb.dataset.sid);
    if (s?.done) { buzz([15, 40, 15]); onStep?.(s); }
  });
  slot.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-reschedule]');
    if (!form) return;
    e.preventDefault();
    if (rescheduleAssignment(form.dataset.reschedule, form.elements.from.value)) toast('Remaining sessions rescheduled');
    else toast('Choose a valid date for the remaining sessions');
  });
  slot.addEventListener('click', (e) => {
    const t = e.target.closest('[data-toggle]'), d = e.target.closest('[data-del]');
    if (t) { const id = t.dataset.toggle; open.has(id) ? open.delete(id) : open.add(id); render(); slot.querySelector(`[data-toggle="${id}"]`)?.focus(); }
    else if (d && confirm('Delete this assignment and its sessions?')) { removeAssignment(d.dataset.del); buzz(20); toast('Assignment deleted'); }
    else if (e.target.closest('[data-add]')) openAssignmentModal({ toast });
  });
  subscribe(() => keepFocus(slot, render));
  render();
}
