import test from 'node:test';
import assert from 'node:assert/strict';
import { chunk, schedule, makeAssignment, streak, estimateMinutes, replan, reschedule } from '../src/lib/chunker.js';

test('sessions are 20-40 minutes', () => {
  for (const [t, d] of [['Cold War essay', '5 page paper on causes'], ['Math worksheet', '30 problems'], ['Read ch 4', ''], ['Thing', '']]) {
    const steps = chunk(t, d);
    assert.ok(steps.length >= 2);
    steps.forEach((s) => assert.ok(s.minutes >= 20 && s.minutes <= 40, `${t}: ${s.minutes}`));
  }
});
test('bigger work estimates more time', () => {
  assert.ok(estimateMinutes('Essay', '10 pages') > estimateMinutes('Essay', '2 pages'));
});
test('chunking is deterministic (minutes/titles)', () => {
  const f = (x) => x.map((s) => [s.title, s.minutes]);
  assert.deepEqual(f(chunk('Essay', '5 pages')), f(chunk('Essay', '5 pages')));
});
test('schedules before due date, in order', () => {
  const a = makeAssignment({ title: 'Cold War essay', description: '5 pages', due: '2026-11-05' }, '2026-10-29');
  a.steps.forEach((s) => assert.ok(s.day >= '2026-10-29' && s.day < '2026-11-05'));
  const days = a.steps.map((s) => s.day);
  assert.deepEqual(days, [...days].sort());
  assert.equal(days[0], '2026-10-29');
});
test('due today schedules everything today', () => {
  const a = makeAssignment({ title: 'Quiz', due: '2026-10-29' }, '2026-10-29');
  assert.ok(a.steps.every((s) => s.day === '2026-10-29'));
});
test('replan moves open steps off the past and keeps done steps', () => {
  const a = makeAssignment({ title: 'Essay', description: '4 pages', due: '2026-11-10' }, '2026-10-29');
  a.steps[0].done = true; a.steps[0].doneAt = '2026-10-29';
  replan(a, '2026-11-02');
  assert.equal(a.steps[0].day, '2026-10-29');
  a.steps.slice(1).forEach((s) => assert.ok(s.day >= '2026-11-02' && s.day < '2026-11-10'));
});
test('rescheduling preserves completed work and validates the new start date', () => {
  const a = makeAssignment({ title: 'Essay', due: '2026-11-10' }, '2026-10-29');
  a.steps[0].done = true; a.steps[0].doneAt = '2026-10-29';
  const originalDay = a.steps[0].day;
  assert.equal(reschedule(a, '2026-11-11', '2026-11-02'), false);
  assert.equal(reschedule(a, '2026-02-30', '2026-02-01'), false);
  assert.equal(reschedule(a, '2026-11-05', '2026-11-02'), true);
  assert.equal(a.steps[0].day, originalDay);
  assert.ok(a.steps.slice(1).every((step) => step.day >= '2026-11-05' && step.day < a.due));
});
test('streak counts consecutive days', () => {
  const mk = (d) => ({ done: true, doneAt: d });
  assert.equal(streak([{ steps: [mk('2026-10-29'), mk('2026-10-28'), mk('2026-10-26')] }], '2026-10-29'), 2);
  assert.equal(streak([{ steps: [mk('2026-10-28')] }], '2026-10-29'), 1);
  assert.equal(streak([{ steps: [] }], '2026-10-29'), 0);
});
