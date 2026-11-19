import { signUp, logIn, startGuest } from '../services/auth.js';
import { getProfile, updateProfile, PRESET_SUBJECTS } from '../lib/profile.js';
import { getNotes } from '../lib/notesStore.js';
import { mountNotesAdder } from './notesAdder.js';
import { esc } from '../lib/util.js';

const LOGO = '<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="4" opacity=".25"/><path d="M16 4a12 12 0 0 1 12 12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="16" cy="16" r="3.5" fill="var(--accent)"/></svg>';

function mount() {
  document.querySelector('.app-shell').hidden = true;
  const el = document.getElementById('gate');
  el.hidden = false;
  return el;
}
const enter = () => { location.hash = '#/schedule'; location.reload(); };

export function showAuth() {
  const el = mount();
  let mode = 'signup';
  const render = () => {
    const signup = mode === 'signup';
    el.innerHTML = `<main class="gate-wrap"><div class="gate-layout"><section class="gate-intro" aria-labelledby="gate-intro-title">
      <div class="logo gate-brand">${LOGO}<span class="logo-text">Task<span>Hub</span></span></div>
      <p class="gate-eyebrow">Your study workspace</p>
      <h2 id="gate-intro-title">Study plans and support for your classwork.</h2>
      <p class="gate-summary">A personal study planner and tutor, built around your assignments and class notes.</p>
      <ul class="gate-benefits">
        <li><span>01</span><div><strong>Plan your work</strong><p>Break assignments into focused study sessions.</p></div></li>
        <li><span>02</span><div><strong>Study your notes</strong><p>Make study guides and flashcards from class material.</p></div></li>
        <li><span>03</span><div><strong>Learn with a tutor</strong><p>Get step-by-step help understanding your material.</p></div></li>
      </ul>
    </section><div class="card gate-card">
      <div class="logo gate-logo">${LOGO}<span class="logo-text">Task<span>Hub</span></span></div>
      <h1>${signup ? 'Create your account' : 'Log in to TaskHub'}</h1>
      <p class="muted">${signup ? 'Break big work into focused sessions and learn straight from your teacher\'s notes.' : 'Log in to pick up where you left off.'}</p>
      <div class="seg" role="group" aria-label="Sign up or log in">
        <button type="button" data-mode="signup" aria-pressed="${signup}">Sign up</button>
        <button type="button" data-mode="login" aria-pressed="${!signup}">Log in</button>
      </div>
      <form id="auth-form" novalidate>
        ${signup ? '<label class="field"><span>Name</span><input name="name" autocomplete="name" required maxlength="40" /></label>' : ''}
        <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required /></label>
        <label class="field"><span>Password ${signup ? '<em>(8+ characters)</em>' : ''}</span><input name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" required /></label>
        <label class="check-inline"><input type="checkbox" id="showpw" /> Show password</label>
        <p class="form-error" role="alert" hidden></p>
        <button class="btn primary" type="submit">${signup ? 'Create account' : 'Log in'}</button>
      </form>
      <button class="btn ghost" type="button" id="guest">Explore as a guest</button>
      <p class="demo-note">Demo only: accounts are stored in this browser on this device. There is no server and this is not production authentication, so don't reuse a real password.</p>
    </div></div></main>`;
    const err = el.querySelector('.form-error');
    el.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; render(); el.querySelector('input').focus(); }));
    el.querySelector('#showpw').addEventListener('change', (e) => { el.querySelector('[name=password]').type = e.target.checked ? 'text' : 'password'; });
    el.querySelector('#guest').addEventListener('click', () => { startGuest(); updateProfile({ name: 'Guest', subjects: [], onboarded: true }); enter(); });
    el.querySelector('#auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true; err.hidden = true;
      try {
        if (signup) { const u = await signUp(f); updateProfile({ name: u.name }); } else { await logIn(f); }
        enter();
      } catch (x) { err.textContent = x.message; err.hidden = false; btn.disabled = false; }
    });
  };
  render();
  el.querySelector('input')?.focus({ preventScroll: true });
}

export function showOnboarding() {
  const el = mount();
  let step = 2;
  const chosen = new Set(getProfile().subjects);
  const added = [...getNotes()];

  const frame = (inner) => `<main class="gate-wrap"><div class="card gate-card wide">
    <p class="steps-ind" aria-label="Step ${step} of 3">Step ${step} of 3 <span class="dots" aria-hidden="true">${[1, 2, 3].map((n) => `<i class="${n <= step ? 'on' : ''}"></i>`).join('')}</span></p>${inner}</div></main>`;

  const subjects = () => {
    el.innerHTML = frame(`<h1>Choose your subjects</h1>
      <p class="muted">Pick your subjects. We'll tailor suggestions to them.</p>
      <div class="chips pick" role="group" aria-label="Subjects">${[...new Set([...PRESET_SUBJECTS, ...chosen])].map((s) => `<button type="button" class="pill" data-subj="${esc(s)}" aria-pressed="${chosen.has(s)}">${esc(s)}</button>`).join('')}</div>
      <form id="custom" class="row"><label class="sr-only" for="cs">Add a subject</label><input id="cs" placeholder="Add another subject" maxlength="30" /><button class="btn ghost" type="submit">Add</button></form>
      <p class="form-error" role="alert" hidden>Pick at least one subject to continue.</p>
      <button class="btn primary" id="next">Continue</button>`);
    el.querySelectorAll('[data-subj]').forEach((b) => b.addEventListener('click', () => {
      const s = b.dataset.subj; chosen.has(s) ? chosen.delete(s) : chosen.add(s);
      b.setAttribute('aria-pressed', String(chosen.has(s)));
    }));
    el.querySelector('#custom').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = el.querySelector('#cs').value.trim();
      if (v) { chosen.add(v); subjects(); el.querySelector('#cs').focus(); }
    });
    el.querySelector('#next').addEventListener('click', () => {
      if (!chosen.size) { el.querySelector('.form-error').hidden = false; return; }
      updateProfile({ subjects: [...chosen] }); step = 3; notes();
    });
  };

  const notes = () => {
    el.innerHTML = frame(`<h1>Share your notes</h1>
      <p class="muted">Upload a PDF, text file or photo, or paste your teacher's notes. We'll turn them into a study guide, flashcards and exam alerts. You can skip this and add notes later.</p>
      <div id="adder"></div><ul class="added" aria-label="Notes added"></ul>
      <div class="row end"><button class="btn ghost" id="back">Back</button><button class="btn primary" id="done">${added.length ? 'Finish' : 'Skip for now'}</button></div>`);
    const list = el.querySelector('.added'), done = el.querySelector('#done');
    const paint = () => { list.innerHTML = added.map((n) => `<li>✓ ${esc(n.title)} <span class="chip">${esc(n.subject)}</span></li>`).join(''); done.textContent = added.length ? 'Finish' : 'Skip for now'; };
    paint();
    mountNotesAdder(el.querySelector('#adder'), { subjects: [...chosen], onAdded: (n) => { added.unshift(n); paint(); } });
    el.querySelector('#back').addEventListener('click', () => { step = 2; subjects(); });
    done.addEventListener('click', () => { updateProfile({ onboarded: true }); enter(); });
  };

  subjects();
  el.querySelector('h1')?.focus();
}
