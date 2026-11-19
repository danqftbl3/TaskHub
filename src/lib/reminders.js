import { getProfile, updateProfile } from './profile.js';
import { getState } from './store.js';
import { dayKey } from './util.js';

const pad = (n) => String(n).padStart(2, '0');

/** Reminders only fire while the app is open (no server/push in this demo). */
export function initReminders(toast) {
  const check = () => {
    const { prefs, lastReminded } = getProfile();
    if (!prefs.reminders || lastReminded === dayKey()) return;
    const d = new Date();
    if (`${pad(d.getHours())}:${pad(d.getMinutes())}` < prefs.reminderTime) return;
    const pending = getState().assignments.flatMap((a) => a.steps).filter((s) => !s.done && s.day === dayKey()).length;
    updateProfile({ lastReminded: dayKey() });
    if (!pending) return;
    const msg = `You have ${pending} focus session${pending > 1 ? 's' : ''} planned today.`;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('TaskHub', { body: msg, icon: '/icon.svg' });
    else toast(msg);
  };
  setInterval(check, 30000);
  check();
}
