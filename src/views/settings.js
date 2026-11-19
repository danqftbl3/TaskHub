import { getProfile, updateProfile, subscribeProfile } from '../lib/profile.js';
import { getNotes, removeNote, clearNotes, subscribeNotes } from '../lib/notesStore.js';
import { currentUser, logOut, deleteAccount, exportAll, renameUser } from '../services/auth.js';
import { getThemePref, setThemePref } from '../lib/theme.js';
import { openNotesModal } from './notesModal.js';
import { esc } from '../lib/util.js';

const LENS = [20, 25, 30, 35, 40];

export function initSettings(root, { toast }) {
  const slot = root.querySelector('[data-slot]');
  slot.className = 'settings';

  function render() {
    const fid = document.activeElement?.id || document.activeElement?.dataset?.focusKey;
    const p = getProfile(), u = currentUser(), notes = getNotes(), theme = getThemePref();
    slot.innerHTML = `
    <section class="card set" aria-labelledby="s-h-profile"><h2 id="s-h-profile">Profile</h2>
      <label class="field"><span>Display name</span><input id="s-name" value="${esc(p.name)}" maxlength="40" /></label>
      <p class="step-meta">${u?.guest ? 'Guest account' : esc(u?.email || '')}</p>
      <p class="demo-note">Demo account: stored only on this device, no server. Not production authentication.</p>
    </section>

    <section class="card set" aria-labelledby="s-h-subj"><h2 id="s-h-subj">My subjects</h2>
      <ul class="chips" aria-label="Your subjects">${p.subjects.map((s) => `<li class="chip lg">${esc(s)}<button type="button" data-rm-subj="${esc(s)}" aria-label="Remove ${esc(s)}">✕</button></li>`).join('') || '<li class="muted">None yet.</li>'}</ul>
      <form id="s-subj-form" class="row"><label class="sr-only" for="s-subj">Add a subject</label><input id="s-subj" placeholder="Add a subject" maxlength="30" /><button class="btn ghost" type="submit">Add</button></form>
    </section>

    <section class="card set" aria-labelledby="s-h-theme"><h2 id="s-h-theme">Appearance</h2>
      <div class="seg" role="group" aria-label="Theme">${['light', 'dark', 'system'].map((t) => `<button type="button" data-theme-pref="${t}" aria-pressed="${theme === t}">${{ light: 'Light', dark: 'Dark', system: 'System' }[t]}</button>`).join('')}</div>
    </section>

    <section class="card set" aria-labelledby="s-h-study"><h2 id="s-h-study">Study preferences</h2>
      <label class="field"><span>Session length</span><select id="s-len">${LENS.map((n) => `<option value="${n}" ${n === p.prefs.sessionLen ? 'selected' : ''}>${n} minutes</option>`).join('')}</select></label>
      <label class="check-inline"><input type="checkbox" id="s-rem" ${p.prefs.reminders ? 'checked' : ''} /> Daily reminder for today's sessions</label>
      <label class="field"><span>Reminder time</span><input id="s-time" type="time" value="${p.prefs.reminderTime}" ${p.prefs.reminders ? '' : 'disabled'} /></label>
      <p class="step-meta">Reminders appear while TaskHub is open (there is no server to push them). New plans use your session length.</p>
    </section>

    <section class="card set" aria-labelledby="s-h-notes"><h2 id="s-h-notes">My notes</h2>
      <ul class="note-list">${notes.map((n) => `<li><div><strong>${esc(n.title)}</strong><span class="step-meta">${esc(n.subject)} · ${esc(n.kind)} · ${n.text.split(/\s+/).length} words · ${new Date(n.added).toLocaleDateString()}</span></div>
        <button type="button" class="btn ghost sm" data-del-note="${n.id}" aria-label="Delete ${esc(n.title)}">Delete</button></li>`).join('') || '<li class="muted">No notes uploaded yet.</li>'}</ul>
      <div class="row"><button class="btn primary" type="button" id="s-add-notes">Add notes</button>
        ${notes.length ? '<button class="btn ghost" type="button" id="s-clear-notes">Delete all notes</button>' : ''}</div>
    </section>

    <section class="card set" aria-labelledby="s-h-data"><h2 id="s-h-data">Data &amp; account</h2>
      <p class="step-meta">Your notes and plans never leave this device.</p>
      <div class="col"><button class="btn ghost" type="button" id="s-export">Export my data (JSON)</button>
        <button class="btn ghost" type="button" id="s-logout">Log out</button>
        <button class="btn ghost danger-btn" type="button" id="s-delete">Delete all my data &amp; account</button></div>
    </section>`;
    if (fid) (document.getElementById(fid) || slot.querySelector(`[data-focus-key="${fid}"]`))?.focus();
  }

  const addSubject = (s) => { s = s.trim(); if (s && !getProfile().subjects.includes(s)) updateProfile({ subjects: [...getProfile().subjects, s] }); };

  slot.addEventListener('click', async (e) => {
    const t = e.target, id = t.closest('[id]')?.id;
    const rm = t.closest('[data-rm-subj]'), th = t.closest('[data-theme-pref]'), dn = t.closest('[data-del-note]');
    if (rm) { updateProfile({ subjects: getProfile().subjects.filter((s) => s !== rm.dataset.rmSubj) }); toast('Subject removed'); }
    else if (th) { setThemePref(th.dataset.themePref); render(); }
    else if (dn) { removeNote(dn.dataset.delNote); toast('Notes deleted'); }
    else if (id === 's-add-notes') openNotesModal({ toast });
    else if (id === 's-clear-notes' && confirm('Delete all uploaded notes and the guides made from them?')) { clearNotes(); toast('All notes deleted'); }
    else if (id === 's-export') {
      const url = URL.createObjectURL(new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'taskhub-data.json' });
      a.click(); URL.revokeObjectURL(url); toast('Data exported');
    } else if (id === 's-logout') { logOut(); location.hash = ''; location.reload(); }
    else if (id === 's-delete' && confirm('Permanently delete your account, notes, plans and progress from this device?')) { deleteAccount(); location.hash = ''; location.reload(); }
  });

  slot.addEventListener('submit', (e) => {
    if (e.target.id !== 's-subj-form') return;
    e.preventDefault();
    addSubject(slot.querySelector('#s-subj').value);
  });

  slot.addEventListener('change', async (e) => {
    const id = e.target.id;
    if (id === 's-name') { const n = e.target.value.trim() || getProfile().name; renameUser(n); updateProfile({ name: n }); toast('Name saved'); }
    else if (id === 's-len') { updateProfile({ prefs: { sessionLen: Number(e.target.value) } }); toast(`New plans use ${e.target.value}-minute sessions`); }
    else if (id === 's-time') updateProfile({ prefs: { reminderTime: e.target.value || '18:00' } });
    else if (id === 's-rem') {
      const on = e.target.checked;
      if (on && typeof Notification !== 'undefined' && Notification.permission === 'default') await Notification.requestPermission();
      updateProfile({ prefs: { reminders: on }, lastReminded: '' });
      toast(on ? (typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'Reminder on' : 'Reminder on (in-app, notifications blocked)') : 'Reminder off');
    }
  });

  subscribeProfile(render); subscribeNotes(render);
  render();
}
