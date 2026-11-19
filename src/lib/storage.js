// Per-user localStorage namespace: ff.u.<userId>.<name>. The active user id lives in ff.session.
const SESSION = 'ff.session';
const safe = (fn, fb) => { try { return fn(); } catch { return fb; } };

export const getSessionId = () => safe(() => localStorage.getItem(SESSION), null);
export const setSessionId = (id) => safe(() => (id ? localStorage.setItem(SESSION, id) : localStorage.removeItem(SESSION)));
export const ukey = (name, id = getSessionId()) => `ff.u.${id}.${name}`;

export const readJSON = (name, fallback) => safe(() => JSON.parse(localStorage.getItem(ukey(name))) ?? fallback, fallback);
export const writeJSON = (name, value) => safe(() => { localStorage.setItem(ukey(name), JSON.stringify(value)); return true; }, false);
export const userKeys = (id) => safe(() => Object.keys(localStorage).filter((k) => k.startsWith(`ff.u.${id}.`)), []);
