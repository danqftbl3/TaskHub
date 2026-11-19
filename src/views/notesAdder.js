import { addNote } from '../lib/notesStore.js';
import { extractText } from '../services/extract.js';
import { esc, buzz } from '../lib/util.js';

let seq = 0;

/** Add-notes form: Paste or Upload tabs feed one set of fields (title, subject, content). Used in onboarding and the Add Notes dialog. */
export function mountNotesAdder(el, { subjects = [], defaultSubject = '', onAdded } = {}) {
  const n = ++seq;
  el.innerHTML = `<div class="adder">
    <div class="seg" role="group" aria-label="How to add notes">
      <button type="button" data-tab="paste" aria-pressed="true">Paste text</button>
      <button type="button" data-tab="upload" aria-pressed="false">Upload file</button>
    </div>
    <div class="upload-box" hidden>
      <div class="upload-row">
        <label class="btn ghost file-btn">Choose .txt, .pdf or image
          <input class="sr-only" type="file" name="files" accept=".pdf,.txt,.md,.markdown,text/*,application/pdf,image/*" /></label>
        <label class="btn ghost file-btn">Scan with camera
          <input class="sr-only" type="file" name="scan" accept="image/*" capture="environment" /></label>
      </div>
      <p class="step-meta">PDF and text are read on this device and the text is placed in the box below so you can check it. Photos can't be read offline yet: type what they say instead.</p>
    </div>
    <label class="field"><span>Guide title</span><input name="title" maxlength="80" placeholder="e.g. Chapter 4: The Cold War" autocomplete="off" /></label>
    <label class="field"><span>Subject / class name</span><input name="subject" list="subj-${n}" maxlength="40" value="${esc(defaultSubject)}" placeholder="e.g. History" autocomplete="off" /></label>
    <datalist id="subj-${n}">${subjects.map((s) => `<option value="${esc(s)}"></option>`).join('')}</datalist>
    <label class="field"><span>Note content</span><textarea name="text" rows="7" placeholder="Paste your teacher's notes or a lecture transcript here…"></textarea></label>
    <p class="status" role="status" aria-live="polite"></p>
    <button class="btn primary" type="button" data-save>Build my study guide</button>
    <p class="privacy">Files are read on this device only. Only the text is saved, and you can delete it any time in Settings.</p>
  </div>`;
  const $ = (s) => el.querySelector(s);
  const status = $('.status');
  const say = (msg, bad = false) => { status.textContent = msg; status.classList.toggle('bad', bad); };
  const tab = (t) => {
    el.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === t)));
    $('.upload-box').hidden = t !== 'upload';
  };
  el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => tab(b.dataset.tab)));

  async function handleFile(f) {
    say(`Reading ${f.name}…`);
    const base = f.name.replace(/\.[^.]+$/, '');
    try {
      const r = await extractText(f);
      if (!$('[name=title]').value) $('[name=title]').value = base;
      if (!r.text.trim()) { say(r.warning, true); tab('paste'); $('[name=text]').focus(); return; }
      $('[name=text]').value = r.text;
      $('[name=text]').dataset.kind = r.kind;
      $('[name=text]').dataset.file = f.name;
      say(`Loaded ${f.name}${r.truncated ? ' (first 80 pages only)' : ''}. Review it, then build your guide.`);
      tab('paste');
    } catch (e) { say(e.message, true); buzz(50); }
  }
  el.querySelectorAll('input[type=file]').forEach((inp) => inp.addEventListener('change', async () => {
    if (inp.files[0]) await handleFile(inp.files[0]);
    inp.value = '';
  }));

  $('[data-save]').addEventListener('click', () => {
    const ta = $('[name=text]');
    try {
      const note = addNote({ title: $('[name=title]').value || 'Untitled notes', subject: $('[name=subject]').value.trim() || 'General', kind: ta.dataset.kind || 'paste', text: ta.value, fileName: ta.dataset.file || '' });
      ta.value = ''; $('[name=title]').value = ''; delete ta.dataset.kind; delete ta.dataset.file;
      say(`Added "${note.title}".`); buzz([10, 30, 10]);
      onAdded?.(note);
    } catch (e) { say(e.message, true); buzz(50); }
  });
}
