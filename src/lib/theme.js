const KEY = 'ff.theme';
const root = document.documentElement;
const mq = matchMedia('(prefers-color-scheme: dark)');

const saved = () => {
  try { const s = localStorage.getItem(KEY); return s === 'light' || s === 'dark' ? s : null; } catch { return null; }
};

function apply(theme) {
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0B1020' : '#F7F8FC');
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

export const getThemePref = () => saved() ?? 'system';
export function setThemePref(pref) {
  try { pref === 'system' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, pref); } catch { /* storage unavailable */ }
  apply(saved() ?? (mq.matches ? 'dark' : 'light'));
}

export function initTheme() {
  apply(saved() ?? (mq.matches ? 'dark' : 'light'));
  requestAnimationFrame(() => root.classList.add('theme-anim'));
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch { /* storage unavailable */ }
    apply(next);
  });
  // Follow system changes until the user makes an explicit choice
  mq.addEventListener('change', (e) => { if (!saved()) apply(e.matches ? 'dark' : 'light'); });
}
