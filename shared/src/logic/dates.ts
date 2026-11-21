export const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date = new Date()): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDay = (k: string): Date => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k: string, n: number): string => { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); };
export const daysBetween = (a: string, b: string): number => Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 864e5);
export const isValidDay = (k: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(k) && dayKey(parseDay(k)) === k;
export const fmtDay = (k: string, today: string = dayKey()): string => {
  const diff = daysBetween(today, k);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return parseDay(k).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};
