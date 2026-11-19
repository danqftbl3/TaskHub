/**
 * LOCAL-ONLY DEMO AUTH. There is no server: accounts live in this browser's localStorage.
 * Passwords are salted + hashed with PBKDF2 (Web Crypto), but this is NOT production authentication.
 */
import { getSessionId, setSessionId, userKeys } from '../lib/storage.js';
import { uid } from '../lib/util.js';

const USERS = 'ff.users';
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const users = () => { try { return JSON.parse(localStorage.getItem(USERS)) || []; } catch { return []; } };
const saveUsers = (u) => localStorage.setItem(USERS, JSON.stringify(u));
async function hashPassword(pw, salt) {
  if (globalThis.crypto?.subtle) {
    const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(salt), iterations: 150000 }, key, 256);
    return `pbkdf2:${b64(bits)}`;
  }
  // Insecure fallback for non-secure contexts (e.g. http on a LAN IP), demo only
  let h = 5381;
  for (const c of salt + pw) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
  return `weak:${h}`;
}
const newSalt = () => b64(crypto.getRandomValues(new Uint8Array(16)));
const publicUser = ({ id, name, email, guest }) => ({ id, name, email, guest: !!guest });

export function currentUser() {
  const id = getSessionId();
  const u = users().find((x) => x.id === id);
  if (!u && id) setSessionId(null);
  return u ? publicUser(u) : null;
}

export async function signUp({ name, email, password }) {
  name = String(name).trim(); email = String(email).trim().toLowerCase();
  if (!name) throw new Error('Please enter your name.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Please enter a valid email address.');
  if (String(password).length < 8) throw new Error('Password must be at least 8 characters.');
  const all = users();
  if (all.some((u) => u.email === email)) throw new Error('An account with that email already exists. Try logging in.');
  const salt = newSalt();
  const user = { id: uid() + uid(), name, email, salt, hash: await hashPassword(password, salt), created: Date.now() };
  saveUsers([...all, user]);
  setSessionId(user.id);
  return publicUser(user);
}

export async function logIn({ email, password }) {
  email = String(email).trim().toLowerCase();
  const u = users().find((x) => x.email === email && !x.guest);
  if (!u || u.hash !== (await hashPassword(String(password), u.salt))) throw new Error('Incorrect email or password.');
  setSessionId(u.id);
  return publicUser(u);
}

export function startGuest() {
  const user = { id: uid() + uid(), name: 'Guest', email: '', guest: true, created: Date.now() };
  saveUsers([...users(), user]);
  setSessionId(user.id);
  return publicUser(user);
}

export const logOut = () => setSessionId(null);

export function renameUser(name) {
  const id = getSessionId();
  saveUsers(users().map((u) => (u.id === id ? { ...u, name } : u)));
}

export function deleteAccount() {
  const id = getSessionId();
  userKeys(id).forEach((k) => localStorage.removeItem(k));
  saveUsers(users().filter((u) => u.id !== id));
  setSessionId(null);
}

export function exportAll() {
  const id = getSessionId();
  const u = users().find((x) => x.id === id);
  const data = {};
  userKeys(id).forEach((k) => { try { data[k.replace(`ff.u.${id}.`, '')] = JSON.parse(localStorage.getItem(k)); } catch { /* skip */ } });
  return { exportedAt: new Date().toISOString(), account: u ? { name: u.name, email: u.email, guest: !!u.guest } : null, data };
}
