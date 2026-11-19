import './styles/tokens.css';
import './styles/base.css';
import { initTheme } from './lib/theme.js';
import { getState, subscribe, rebalanceAll } from './lib/store.js';
import { streak } from './lib/chunker.js';
import { initSchedule } from './views/schedule.js';
import { initAssignments } from './views/assignments.js';
import { initVault } from './views/vault.js';
import { initTutor } from './views/tutor.js';
import { openAssignmentModal } from './views/modal.js';
import { openNotesModal } from './views/notesModal.js';
import { initSettings } from './views/settings.js';
import { showAuth, showOnboarding } from './views/gate.js';
import { currentUser } from './services/auth.js';
import { getProfile } from './lib/profile.js';
import { initReminders } from './lib/reminders.js';
import { openFocusTimer } from './views/timer.js';

const TITLES = { schedule: 'Schedule', assignments: 'Assignments', vault: 'Study Vault', tutor: 'Tutor AI', settings: 'Settings' };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function route() {
  const name = (location.hash.match(/^#\/(\w+)/) || [])[1];
  const view = TITLES[name] ? name : 'schedule';
  $$('.view').forEach((v) => { v.hidden = v.dataset.view !== view; });
  $$('.tab').forEach((t) => {
    if (t.dataset.tab === view) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  document.title = `${TITLES[view]} · TaskHub`;
  scrollTo({ top: 0 });
}

let toastTimer;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function initFab() {
  const fab = $('#fab'), menu = $('#fab-menu'), scrim = $('#scrim');
  const set = (open) => {
    fab.setAttribute('aria-expanded', String(open));
    menu.hidden = scrim.hidden = !open;
    if (open) $('button', menu).focus();
  };
  fab.addEventListener('click', () => set(menu.hidden));
  scrim.addEventListener('click', () => set(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); fab.focus(); } });
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b) return;
    set(false);
    if (b.dataset.action === 'assignment') openAssignmentModal({ toast });
    else if (b.dataset.action === 'notes') openNotesModal({ toast });
    else openFocusTimer({ toast });
  });
}

function updateStreak() {
  const n = streak(getState().assignments);
  $('#streak-count').textContent = n;
  $('.streak').setAttribute('aria-label', `Study streak: ${n} ${n === 1 ? 'day' : 'days'}`);
}

initTheme();
if (!currentUser()) showAuth();
else if (!getProfile().onboarded) showOnboarding();
else startApp();

function startApp() {
initFab();
rebalanceAll();
const ctx = { toast, onStep: () => toast('Session complete') };
initSchedule($('#view-schedule'), ctx);
initAssignments($('#view-assignments'), ctx);
initVault($('#view-vault'), ctx);
initTutor($('#view-tutor'));
subscribe(updateStreak);
updateStreak();
addEventListener('hashchange', route);
route();
initSettings($('#view-settings'), { toast });
initReminders(toast);
}
