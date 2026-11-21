import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { reschedule } from '../src/logic/chunker';

const assignment = {
  id: 'a', title: 'Essay', description: '', due: '2026-11-25', created: '2026-11-20',
  steps: [
    { id: 'done', title: 'Done', minutes: 25, day: '2026-11-20', done: true, doneAt: '2026-11-20' },
    { id: 'open', title: 'Open', minutes: 25, day: '2026-11-21', done: false, doneAt: null },
  ],
};

test('rescheduling moves only unfinished sessions without mutating the original', () => {
  const result = reschedule(assignment, '2026-11-23', '2026-11-20');
  assert.ok(result);
  assert.equal(result.rescheduleFrom, '2026-11-23');
  assert.deepEqual(result.steps[0], assignment.steps[0]);
  assert.equal(result.steps[1].day, '2026-11-23');
  assert.equal(assignment.steps[1].day, '2026-11-21');
});

test('rescheduling rejects invalid dates, dates outside the range, and completed assignments', () => {
  for (const date of ['2026-11-19', '2026-11-26', '2026-02-30', 'not-a-date']) {
    assert.equal(reschedule(assignment, date, '2026-11-20'), null);
  }
  assert.equal(reschedule({ ...assignment, steps: [assignment.steps[0]] }, '2026-11-20', '2026-11-20'), null);
});
