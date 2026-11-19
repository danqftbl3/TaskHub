import { esc, fmtDay } from '../lib/util.js';

export const stepRow = (a, s, showAssignment = false) => `
  <li class="step ${s.done ? 'done' : ''}">
    <label class="check">
      <input type="checkbox" data-aid="${a.id}" data-sid="${s.id}" ${s.done ? 'checked' : ''} />
      <span class="box" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></span>
      <span class="step-text">
        <span class="step-title">${esc(s.title)}</span>
        <span class="step-meta">${showAssignment ? esc(a.title) + ' · ' : ''}${s.minutes} min${s.done ? ' · Done ✓' : ''}</span>
      </span>
    </label>
    ${showAssignment && !s.done ? `<button class="btn ghost sm step-focus" type="button" data-focus-aid="${esc(a.id)}" data-focus-sid="${esc(s.id)}" aria-label="Start focus timer for ${esc(s.title)}">Focus</button>` : ''}
  </li>`;

export const dueLabel = (a, today) => `Due ${fmtDay(a.due, today)}`;

/** Re-render while keeping keyboard focus on the toggled checkbox. */
export function keepFocus(root, render) {
  const id = document.activeElement?.dataset?.sid;
  render();
  if (id) root.querySelector(`[data-sid="${id}"]`)?.focus();
}
