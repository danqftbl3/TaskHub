import { dayKey } from './util.js';
import { readJSON, writeJSON } from './storage.js';
import { replan, reschedule } from './chunker.js';

const subs = new Set();
let state = { assignments: [] };

{ const raw = readJSON('data', null); if (raw?.assignments) state = raw; }

const save = () => writeJSON('data', state);
const emit = () => { save(); subs.forEach((f) => f(state)); };

export const getState = () => state;
export const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

export function addAssignment(a) { state.assignments.unshift(a); emit(); }
export function removeAssignment(id) { state.assignments = state.assignments.filter((a) => a.id !== id); emit(); }

export function rescheduleAssignment(id, from) {
  const assignment = state.assignments.find((item) => item.id === id);
  if (!assignment || !reschedule(assignment, from)) return false;
  assignment.rescheduleFrom = from;
  emit();
  return true;
}

export function toggleStep(aid, sid) {
  const a = state.assignments.find((x) => x.id === aid), s = a?.steps.find((x) => x.id === sid);
  if (!s) return null;
  s.done = !s.done;
  s.doneAt = s.done ? dayKey() : null;
  const today = dayKey();
  replan(a, a.rescheduleFrom > today ? a.rescheduleFrom : today); // checking a step rebalances the remaining blocks
  emit();
  return s;
}

/** Rebalance anything that slipped into the past; call on load. */
export function rebalanceAll() {
  const today = dayKey();
  let changed = false;
  for (const a of state.assignments) {
    if (a.steps.some((s) => !s.done && s.day < today)) { replan(a, today); changed = true; }
  }
  if (changed) emit();
}
