# TaskHub Mobile (Expo / React Native)

Native iOS/Android (and Expo web) version of TaskHub. TypeScript, React Navigation, Zustand + AsyncStorage, Reanimated, expo-haptics. The Vite web app in the parent folder is untouched.

## Run

```bash
cd mobile
npm install
npx expo start        # press i (iOS simulator), a (Android), w (web), or scan the QR with Expo Go
```

**Always run Expo commands from inside `mobile/`** (never the repo root, which is the Vite web app). Expo Go must be the current store version (supports SDK 58).

Checks: `npx tsc --noEmit` and `npx expo export` (bundles web/iOS/Android).

## What's inside

- **Auth gate**: persisted state picks the Auth stack (Sign Up, Login, Guest / Try Demo) or the bottom tabs.
- **Schedule**: greeting, streak badge, Sun/Moon toggle, animated progress ring, today's timeline with haptic checkboxes, and an intake modal that splits an assignment into 20-35 minute steps spread before the due date.
- **Study Vault**: starts empty. "+ Add notes" (paste, or .txt/.md/.pdf) builds a guide *only from your text*: takeaways, exam alerts (Must know / Likely), key terms with a Deep Explainer, common mistakes, 3D flip flashcards (Got it / Review Again). Missing sections say "Not found in your notes". Cold War content loads only via "Load Demo Sample (Cold War)" or Guest.
- **Tutor AI**: offline, deterministic. Homework requests (including disguised ones) are refused **in code** (`src/services/guardrail.ts`, runs before any answer) with the 3-step reply: context, outline (no finished prose), one Socratic question.
- **Settings**: profile, System/Light/Dark theme (persisted), stats, in-app feedback (5 stars + comments) that opens the mail composer to danqftbl3@gmail.com, subject `TaskHub App Feedback - [v1.0]` (falls back to a `mailto:` link), Sign Out, Reset Stored Data.

## Important notes

- **Auth is a local-only demo, not production auth.** There is no backend; accounts live in AsyncStorage on the device with salted, iterated SHA-256 hashes (expo-crypto). "Forgot Password?" resets the password locally for an account on the same device.
- **PDF extraction is best-effort** (`src/services/extract.ts`, pure JS). Scanned/image PDFs and photos can't be read; the app then asks you to paste the text. Files stay on the device.
- No API keys or secrets are used or stored.
- Structure: `src/screens`, `src/components`, `src/context` (store), `src/theme`, `src/logic`, `src/services`, `src/navigation`.
