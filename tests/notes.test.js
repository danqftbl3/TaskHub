import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGuide, splitLines } from '../src/lib/notes.js';

const text = `Photosynthesis is the process plants use to turn light into chemical energy.
Chlorophyll is the green pigment that absorbs light.
IMPORTANT: the exam will ask about the light-dependent reactions.
Remember that photosynthesis happens in the chloroplast. Plants need water and carbon dioxide.
A common mistake is thinking plants get their mass from soil.`;

test('splitLines returns non-empty lines', () => {
  assert.ok(splitLines(text).length >= 4);
});

test('buildGuide is grounded and labelled', () => {
  const g = buildGuide({ id: 'x1', title: 'Bio', subject: 'Biology', text });
  assert.equal(g.id, 'note-x1');
  assert.ok(g.generated);
  assert.ok(g.terms.some((t) => /photosynthesis/i.test(t.term)));
  assert.ok(g.alerts.length >= 1);
  for (const t of g.takeaways) assert.ok(t.line >= 1 && t.line <= g.source.lines.length);
});

test('explanations do not expose line numbers or claim an invented analogy', () => {
  const guide = buildGuide({ id: 'x1', title: 'Bio', subject: 'Biology', text });
  const term = guide.terms.find((t) => /photosynthesis/i.test(t.term));
  assert.equal(term.analogy, term.def);
  assert.doesNotMatch(`${term.analogy} ${term.academic} ${term.example}`, /\bline \d+|in plain words/i);
});
