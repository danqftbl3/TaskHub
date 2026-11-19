import { addAssignment } from '../lib/store.js';
import { makeAssignment } from '../lib/chunker.js';
import { dayKey, addDays, buzz } from '../lib/util.js';
import { getProfile } from '../lib/profile.js';

let dlg;

function build() {
  dlg = document.createElement('dialog');
  dlg.className = 'modal';
  dlg.setAttribute('aria-labelledby', 'm-title');
  dlg.innerHTML = `<form method="dialog" class="modal-form" novalidate>
    <div class="modal-head"><h2 id="m-title">New assignment</h2>
      <button type="button" class="icon-btn" data-close aria-label="Close">✕</button></div>
    <label class="field"><span>Title</span><input name="title" required maxlength="100" placeholder="e.g. Cold War essay" autocomplete="off" /></label>
    <label class="field"><span>Due date</span><input name="due" type="date" required /></label>
    <label class="field"><span>Description <em>(optional, helps size the work)</em></span>
      <textarea name="description" rows="3" maxlength="600" placeholder="e.g. 5 page essay on causes of the Cold War, needs 3 sources"></textarea></label>
    <p class="form-error" role="alert" hidden></p>
    <button class="btn primary" type="submit">Split into sessions</button>
  </form>`;
  document.body.append(dlg);
  const form = dlg.querySelector('form'), err = dlg.querySelector('.form-error');
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form), title = String(f.get('title')).trim(), due = String(f.get('due'));
    const fail = (m) => { err.textContent = m; err.hidden = false; buzz(60); };
    if (!title) return fail('Please enter a title.');
    if (!due) return fail('Please choose a due date.');
    if (due < dayKey()) return fail('The due date is in the past.');
    const a = makeAssignment({ title, due, description: String(f.get('description')), target: getProfile().prefs.sessionLen });
    addAssignment(a);
    buzz([10, 30, 10]);
    dlg.close();
    dlg._toast?.(`Planned ${a.steps.length} sessions for "${a.title}"`);
    location.hash = '#/schedule';
  });
}

export function openAssignmentModal({ toast } = {}) {
  if (!dlg) build();
  dlg._toast = toast;
  const form = dlg.querySelector('form');
  form.reset();
  dlg.querySelector('.form-error').hidden = true;
  const due = form.elements.due;
  due.min = dayKey();
  due.value = addDays(dayKey(), 5);
  dlg.showModal();
  form.elements.title.focus();
}
