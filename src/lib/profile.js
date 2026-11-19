import { readJSON, writeJSON } from './storage.js';

export const PRESET_SUBJECTS = ['Math', 'Biology', 'Chemistry', 'Physics', 'History', 'English', 'Geography', 'Computer Science', 'Economics', 'Languages', 'Art', 'Psychology'];

const DEFAULTS = { name: '', subjects: [], onboarded: false, sampleLoaded: false, lastReminded: '', prefs: { sessionLen: 30, reminders: false, reminderTime: '18:00' } };
const subs = new Set();
const stored = readJSON('profile', {});
let profile = { ...DEFAULTS, ...stored, prefs: { ...DEFAULTS.prefs, ...(stored.prefs || {}) } };

export const getProfile = () => profile;
export const subscribeProfile = (f) => { subs.add(f); return () => subs.delete(f); };

export function updateProfile(patch) {
  profile = { ...profile, ...patch, prefs: { ...profile.prefs, ...(patch.prefs || {}) } };
  writeJSON('profile', profile);
  subs.forEach((f) => f(profile));
}
