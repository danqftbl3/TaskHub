import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Assignment, Guide } from '../logic/types';
import type { ThemePref } from '../theme/tokens';
import { buildGuide } from '../logic/notes';
import { makeAssignment, replan, streak } from '../logic/chunker';
import { addDays, dayKey, uid } from '../logic/dates';
import { COLD_WAR_GUIDE } from '../data/coldwar';
import { hashPassword, newSalt, validEmail } from '../services/auth';
import type { TutorReply } from '../services/tutor';

export interface User { id: string; name: string; email: string; level: string; salt: string; hash: string; guest?: boolean }
export interface ChatMsg { id: string; role: 'user' | 'bot'; reply?: TutorReply; text: string }
export interface UserData {
  assignments: Assignment[]; guides: Guide[]; cardProgress: Record<string, 'got' | 'review'>;
  chat: ChatMsg[]; feedback: { rating: number; comment: string; at: number }[]; sessionsDone: number;
}
const emptyData = (): UserData => ({ assignments: [], guides: [], cardProgress: {}, chat: [], feedback: [], sessionsDone: 0 });

export const GUEST_ID = 'guest-demo';

interface State {
  users: User[]; sessionId: string | null; themePref: ThemePref; data: Record<string, UserData>; hydrated: boolean;
  signUp: (p: { name: string; email: string; password: string; level: string }) => Promise<string | null>;
  logIn: (email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string, password: string) => Promise<string | null>;
  startGuest: () => void;
  signOut: () => void;
  setTheme: (t: ThemePref) => void;
  addAssignment: (p: { title: string; description: string; due: string }) => void;
  toggleStep: (aid: string, sid: string) => boolean;
  addGuide: (p: { title: string; subject: string; text: string; fileName?: string }) => string;
  loadDemo: () => string;
  removeGuide: (id: string) => void;
  markCard: (key: string, v: 'got' | 'review') => void;
  pushChat: (msgs: ChatMsg[]) => void;
  addFeedback: (rating: number, comment: string) => void;
  resetData: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const patch = (fn: (d: UserData) => Partial<UserData>) => {
        const id = get().sessionId; if (!id) return;
        const cur = get().data[id] ?? emptyData();
        set({ data: { ...get().data, [id]: { ...cur, ...fn(cur) } } });
      };
      return {
        users: [], sessionId: null, themePref: 'system', data: {}, hydrated: false,
        async signUp({ name, email, password, level }) {
          if (!name.trim()) return 'Please enter your full name.';
          if (!validEmail(email)) return 'Enter a valid email address.';
          if (password.length < 8) return 'Password needs at least 8 characters.';
          const e = email.trim().toLowerCase();
          if (get().users.some((u) => u.email === e)) return 'An account with this email already exists. Try logging in.';
          const salt = newSalt();
          const user: User = { id: uid(), name: name.trim(), email: e, level: level.trim() || 'Not set', salt, hash: await hashPassword(password, salt) };
          set({ users: [...get().users, user], sessionId: user.id, data: { ...get().data, [user.id]: emptyData() } });
          return null;
        },
        async logIn(email, password) {
          const u = get().users.find((x) => x.email === email.trim().toLowerCase());
          if (!u || (await hashPassword(password, u.salt)) !== u.hash) return 'Email or password is incorrect.';
          set({ sessionId: u.id });
          return null;
        },
        async resetPassword(email, password) {
          if (password.length < 8) return 'New password needs at least 8 characters.';
          const u = get().users.find((x) => x.email === email.trim().toLowerCase());
          if (!u) return 'No account on this device uses that email.';
          const salt = newSalt();
          const hash = await hashPassword(password, salt);
          set({ users: get().users.map((x) => (x.id === u.id ? { ...x, salt, hash } : x)) });
          return null;
        },
        startGuest() {
          const today = dayKey();
          const guest: User = { id: GUEST_ID, name: 'Guest', email: 'guest@demo.local', level: 'Demo', salt: '', hash: '', guest: true };
          const a = makeAssignment({ title: 'Cold War essay', description: 'Write an essay on the causes of the Cold War, with research and proofreading.', due: addDays(today, 5) });
          set({
            users: get().users.some((u) => u.id === GUEST_ID) ? get().users : [...get().users, guest],
            sessionId: GUEST_ID,
            data: { ...get().data, [GUEST_ID]: { ...emptyData(), assignments: [a], guides: [COLD_WAR_GUIDE] } },
          });
        },
        signOut: () => set({ sessionId: null }),
        setTheme: (themePref) => set({ themePref }),
        addAssignment: (p) => patch((d) => ({ assignments: [makeAssignment(p), ...d.assignments] })),
        toggleStep(aid, sid) {
          let nowDone = false;
          patch((d) => ({
            sessionsDone: d.sessionsDone,
            assignments: d.assignments.map((a) => {
              if (a.id !== aid) return a;
              const steps = a.steps.map((s) => { if (s.id !== sid) return s; nowDone = !s.done; return { ...s, done: nowDone, doneAt: nowDone ? dayKey() : null }; });
              return replan({ ...a, steps });
            }),
          }));
          patch((d) => ({ sessionsDone: d.assignments.reduce((n, a) => n + a.steps.filter((s) => s.done).length, 0) }));
          return nowDone;
        },
        addGuide({ title, subject, text, fileName }) {
          const g = buildGuide({ id: uid(), title: title.trim() || 'Untitled notes', subject: subject.trim() || 'General', text, fileName });
          patch((d) => ({ guides: [g, ...d.guides] }));
          return g.id;
        },
        loadDemo() {
          patch((d) => ({ guides: d.guides.some((g) => g.demo) ? d.guides : [COLD_WAR_GUIDE, ...d.guides] }));
          return COLD_WAR_GUIDE.id;
        },
        removeGuide: (id) => patch((d) => ({ guides: d.guides.filter((g) => g.id !== id) })),
        markCard: (key, v) => patch((d) => ({ cardProgress: { ...d.cardProgress, [key]: v } })),
        pushChat: (msgs) => patch((d) => ({ chat: [...d.chat, ...msgs].slice(-60) })),
        addFeedback: (rating, comment) => patch((d) => ({ feedback: [...d.feedback, { rating, comment, at: Date.now() }] })),
        resetData: () => patch(() => emptyData()),
      };
    },
    {
      name: 'taskhub.v1', storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ users: s.users, sessionId: s.sessionId, themePref: s.themePref, data: s.data }),
      onRehydrateStorage: () => () => { useStore.setState({ hydrated: true }); },
    },
  ),
);

export const EMPTY: UserData = emptyData();
export const useUser = (): User | null => useStore((s) => s.users.find((u) => u.id === s.sessionId) ?? null);
export const useData = (): UserData => useStore((s) => (s.sessionId && s.data[s.sessionId]) || EMPTY);
export const useStreak = (): number => { const a = useData().assignments; return streak(a); };
