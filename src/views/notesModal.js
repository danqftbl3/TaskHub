import { mountNotesAdder } from './notesAdder.js';
import { getProfile } from '../lib/profile.js';

let dlg;

export function openNotesModal({ subject = '', toast } = {}) {
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.className = 'modal';
    dlg.setAttribute('aria-labelledby', 'nm-title');
    document.body.append(dlg);
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  }
  dlg.innerHTML = `<div class="modal-form"><div class="modal-head"><h2 id="nm-title">Add notes</h2>
    <button type="button" class="icon-btn" data-close aria-label="Close">✕</button></div><div id="nm-body"></div></div>`;
  mountNotesAdder(dlg.querySelector('#nm-body'), {
    subjects: getProfile().subjects, defaultSubject: subject,
    onAdded: (note) => { dlg.close(); toast?.('Study guide ready ✨'); location.hash = `#/vault?guide=note-${note.id}`; },
  });
  dlg.showModal();
}
