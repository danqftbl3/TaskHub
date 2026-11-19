export const uid = () => Math.random().toString(36).slice(2, 10);
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDay = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k, n) => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 864e5);
export const fmtDay = (k, today = dayKey()) => {
  const diff = daysBetween(today, k);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return parseDay(k).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};
export const buzz = (p = 12) => { try { navigator.vibrate?.(p); } catch { /* unsupported */ } };

export function ring(pct, size = 64, label = 'Progress') {
  const stroke = size > 100 ? 12 : 8, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, pct)) / 100), h = size / 2;
  return `<div class="ring" style="--s:${size}px" role="img" aria-label="${esc(label)}: ${Math.round(pct)} percent">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle class="ring-bg" cx="${h}" cy="${h}" r="${r}" stroke-width="${stroke}"/>
      <circle class="ring-fg" cx="${h}" cy="${h}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${h} ${h})"/>
    </svg><span aria-hidden="true">${Math.round(pct)}%</span></div>`;
}
