# TaskHub

Student-first productivity and learning app. Break assignments into 20–35 min micro-sessions and turn teacher notes into study guides. The AI guides; it never does your homework.

**Built so far:** theme engine + shell, assignment chunking and daily schedule (progress ring, streak), Study Vault (Cold War demo guide: takeaways, exam alerts, key terms with Deep Explainer, flip flashcards, source links), and Tutor AI with an academic-integrity guardrail.

## Guardrail
`src/services/guardrail.js` detects homework-completion requests in code (including disguised ones like "a paragraph I can copy") *before* any model is called, and returns a fixed refusal with a 3-step scaffold. `src/services/ai.js` uses an optional `VITE_AI_API_KEY`; with no key a deterministic offline tutor answers from the teacher notes. `npm test` runs the guardrail and chunker tests.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the build
```

## Theme

Tokens live in `src/styles/tokens.css` (CSS variables, light "Clear & Focused" / dark "Deep Focus"). `src/lib/theme.js` follows the system theme by default, and the Sun/Moon toggle persists the choice in `localStorage` (`ff.theme`).

## AI keys

Copy `.env.example` to `.env` and set `VITE_AI_API_KEY` (optional; never commit it).

## Accounts, notes and settings

- **Demo auth only.** Sign up / log in is local to your browser (PBKDF2-hashed password via Web Crypto, per-user data in `localStorage`, session persistence, logout). There is no server and this is **not production authentication**. "Explore as a guest" skips it.
- **Onboarding:** sign up → pick subjects → add notes (skippable) → app.
- **Notes upload:** PDF (text extracted locally with pdf.js), `.txt`/`.md`, pasted text, or camera/image. Images have no OCR yet, so you're asked to paste the text. Files never leave the device; only extracted text is stored and it is deletable in Settings.
- **Notes drive the app:** each note becomes a Study Vault guide (takeaways, key terms, Exam Alerts, flashcards, source lines) built deterministically from your text only. Missing material is flagged "Beyond your teacher's notes". Schedule suggestions and Tutor prompts follow your subjects and notes.
- **Settings:** profile, subjects, theme (light/dark/system), session length, in-app reminders (only while the app is open), manage/delete notes, export JSON, delete all data, logout.
- The homework guardrail is unchanged and runs before any AI call.

## Study workflows

- **Focus timer:** Open Quick add → Start focus timer, or use Focus beside a scheduled session. Pause or reset the timer, then explicitly mark a linked session done when it finishes. Optional white, pink, and brown noise is generated on the device; it continues when the dialog is closed and stops when the timer ends or resets. The timer resets if the app is reloaded or closed.
- **Rescheduling:** On an assignment, choose a new start date to redistribute its unfinished sessions through the due date. Completed sessions stay unchanged.
- **Practice quiz:** Each Study Vault guide offers up to five questions from its flashcards. Compare your answer with the sourced answer and assess it yourself; quiz progress resets on reload or when changing guides.
- **Guide depth and tutor:** Summary shows a short overview; Standard includes the explained notes; Deep dive adds related source passages. Open a term to chat with the tutor in the explainer, then continue the same conversation in Tutor AI. Without a configured AI service, the offline coach gives limited responses drawn from the notes.

- **Clean by default:** the Study Vault starts empty with an "Upload Your First Notes" prompt. The Cold War sample loads only if you press **Load Sample Demo Notes** in the Vault, and it can be removed the same way.

## Mobile app

A native Expo/React Native version lives in [`mobile/`](mobile/README.md) (`cd mobile && npm install && npx expo start`).
