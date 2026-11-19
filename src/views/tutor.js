import { getGuides } from '../lib/guides.js';
import { subscribeNotes } from '../lib/notesStore.js';
import { esc } from '../lib/util.js';
import { askTutor, mountTutorChat } from './tutorChat.js';

function suggestions() {
  const terms = getGuides().filter((g) => !g.demo).flatMap((g) => g.terms.slice(0, 2).map((t) => `What is ${t.term}?`)).slice(0, 4);
  const base = terms.length ? terms : ['How do I start a big assignment?', 'How should I study for an exam?'];
  return [...base, 'Do my homework for me'];
}

export function initTutor(root) {
  const slot = root.querySelector('[data-slot]');
  slot.className = 'tutor';
  slot.innerHTML = '<div class="card chat"><div class="chat-body"></div><div class="suggest"></div></div>';
  mountTutorChat(slot.querySelector('.chat-body'));
  const suggestionsEl = slot.querySelector('.suggest');
  const chips = () => {
    suggestionsEl.innerHTML = suggestions().map((s) => `<button type="button" class="chip btn-chip" data-s="${esc(s)}">${s.startsWith('Do my') ? 'Test the guardrail' : esc(s)}</button>`).join('');
  };
  chips(); subscribeNotes(chips);
  suggestionsEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-s]');
    if (button) askTutor(button.dataset.s);
  });
}
