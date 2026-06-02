# UniVibe — MVP

A warm, anti-corporate first-week-of-university app for Monash. Onboarding feels like a chat with a thoughtful friend; matching produces small, joinable rooms instead of feeds; Campus Vibe gives a personalised cultural snapshot; Career Pathway shows three honest shapes a career could take, with a micro-skill follow-up for each.

This repository is the **complete MVP** — landing, demo auth, AI onboarding, matched rooms, joinable chat, Campus Vibe (Monash-only), Career Pathway Builder, and the Micro-skill module.

---

## Quickstart — 10 steps from zip to running

1. **Download the zip** from wherever you received it.
2. **Unzip** it somewhere you'll remember (e.g. `~/code/univibe-mvp`).
3. **Open the folder in VS Code** (`File → Open Folder…`).
4. **Install Node.js** if you don't already have it.
   - Recommended: Node 18 or 20 (LTS). Get it from [nodejs.org](https://nodejs.org/) or use a version manager like nvm/fnm.
   - Check with: `node -v`
5. **Open a terminal inside VS Code** (`` Ctrl + ` ``) and install dependencies:
   ```bash
   npm install
   ```
6. **(Optional) Copy the env file** — only needed if you want real Gemini generation:
   ```bash
   cp .env.example .env
   ```
   Skip this step entirely if you're happy with the deterministic fallbacks. The app works fully without any env file.
7. **(Optional) Set your Gemini API key.** Open `.env` and paste your key:
   ```
   GEMINI_API_KEY=your-key-here
   ```
   Grab one from [Google AI Studio](https://aistudio.google.com/app/apikey).
8. **Run the dev server:**
   ```bash
   npm run dev
   ```
9. **Open the URL** the terminal prints (typically [http://localhost:5000](http://localhost:5000)).
10. **Use the app:** click **Continue as demo student** for the fastest path, or sign up. Then run through onboarding once to unlock the dashboard, Campus Vibe, and Career Pathway.

---

## What's in the MVP

| Module | Route | Notes |
| --- | --- | --- |
| Landing | `/#/` | Warm hero, the pitch, the doors in. |
| Demo auth | `/#/auth` and `/#/auth/signup` | Signup, login, or one-tap demo student. Demo only — Supabase Auth swap-in later. |
| AI Onboarding | `/#/onboarding` | 7 chat-style questions. Generates a personality profile, archetype, and match seed. |
| Dashboard | `/#/dashboard` | Profile recap, matched rooms, live Campus Vibe + Career Pathway entry cards. |
| Matched rooms | `/#/dashboard` | 6 personalised rooms ranked from a static catalog + your signals. |
| Room chat | `/#/room/:id` | Seeded peer messages + your sent messages, polling every few seconds. |
| Campus Vibe | `/#/campus-vibe` | Monash-only for MVP. Map pins, "A Day In Your Life" narrative, real student stories, ranked clubs + events. |
| Career Pathway | `/#/career-pathway` | Degree + 3-5 values → 3 paths (Traditional / Hybrid / Non-Linear). |
| Micro-skill | `/#/micro-skill?topic=…&path=…` | 5-step reflect/choice mini-lesson, persisted completion. |

All routes use **wouter hash routing** (`/#/`) so the app is iframe-safe and zip-portable.

---

## How AI works (and how to test both modes)

Every AI surface (onboarding profile, Campus Vibe narrative, Career Pathway paths, Micro-skill lessons) follows the same pattern in `server/`:

1. If `GEMINI_API_KEY` is set in the environment, the server calls `gemini-1.5-flash`.
2. If the key is missing, the request fails, or the package isn't installed, the server falls back to a **deterministic generator** seeded from the user's answers.
3. The frontend renders the result identically either way; each AI surface includes a small `Source: Gemini | UniVibe deterministic generator` line so you can see which path ran.

You can switch between modes at any time by setting / unsetting `GEMINI_API_KEY` in `.env` and restarting `npm run dev`.

---

## Architecture

```
client/        Vite + React + TanStack Query + wouter (hash routing)
  src/pages/   landing, auth, onboarding, dashboard, room,
               campus-vibe, career-pathway, micro-skill,
               coming-soon, not-found
  src/lib/     auth (in-React-state only — no browser storage),
               queryClient (TanStack Query + apiRequest)
server/        Express + Drizzle ORM + better-sqlite3
  index.ts     boots app, wires Vite middleware
  routes.ts    all /api/* endpoints
  ai.ts        onboarding profile + group generation + seed peer messages
  campus.ts    Monash data catalog + ranking + narrative generation
  career.ts    Career pathway + micro-skill generation
  storage.ts   IStorage interface + SQLite implementation
shared/
  schema.ts    Drizzle tables + zod schemas + shared TypeScript types
data.db        SQLite file (created at first run, committed-friendly)
```

### Storage rule

**No browser storage** anywhere in the app. No `localStorage`, no `sessionStorage`, no `indexedDB`, no cookies. Transient state lives in React state / context; persistent state goes to SQLite via the backend.

### Data model

- `users` — demo username/password (Supabase Auth will replace this column-for-column later).
- `profiles` — the outcome of onboarding (answers + personality tags + archetype + match seed).
- `rooms` + `room_members` — the 6 matched rooms per user, joinable, member-counted.
- `messages` — chat in a room. Polled by the frontend.
- `career_runs` — persisted Career Pathway generations so users can revisit.
- `micro_skill_completions` — tiny completion log for the Micro-skill module.

---

## Switching to Supabase later

The MVP intentionally does **not** require Supabase to run, but the codebase is shaped so that swapping in Supabase is a flat replacement, not a rewrite:

| Concern | MVP today | Supabase swap |
| --- | --- | --- |
| Auth | Demo username/password in `users.password` | Replace with `supabase_user_id` foreign key; read the user from the verified JWT. |
| Persistence | `better-sqlite3` via Drizzle | Same Drizzle schema, swap the driver to Postgres. |
| Realtime chat | Polling `/api/rooms/:id/messages` | Replace the GET with a Supabase Realtime channel subscription — the message insert path is already separated. |

Inline comments in `shared/schema.ts`, `server/routes.ts`, and `server/storage.ts` flag each spot.

When you're ready, drop your Supabase credentials into `.env`:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

None of these are required for the MVP.

---

## Styling

- **Warm campus identity:** cream/paper backgrounds, deep ink text, amber/peach primary, sage/teal accent. Paper grain overlay. Squiggly hand-drawn underline accent.
- **Fonts:** Fraunces (display, headlines), Plus Jakarta Sans (body), Architects Daughter (hand-drawn eyebrows).
- **Anti-AI-aesthetic:** no purple gradients, no glass shimmer, no "AI assistant" tropes. Anti-corporate, peer-to-peer voice everywhere.

The full theme lives in `client/src/index.css` and `tailwind.config.ts`.

---

## Useful commands

```bash
npm run dev          # start the app (Express + Vite on one port)
npm run build        # production bundle
npm run start        # serve the built bundle
npm run check        # TypeScript type-check
npm run db:push      # apply Drizzle schema (rarely needed — ensureSchema() handles MVP migrations)
```

---

## Known limitations / future work

- Monash is the only seeded university. The Campus Vibe catalog is plain data in `server/campus.ts` — add another entry to `UNIVERSITIES` and the API + UI just work.
- Campus narrative voice ranges across Gemini and the deterministic generator; rough edges are real.
- Demo auth is intentionally insecure (plaintext passwords). Replace before any real users.
- Chat uses polling. The Realtime swap path is documented above.
- No real-time presence, no notifications, no DMs — these are intentional cuts for the MVP.

---

## Voice and design intent

If you remember one thing about UniVibe: **it is not LinkedIn for students.** It is the friend who texts you on the first day of uni to say "you're going to be okay, here's where you'd actually fit." Everything else — onboarding, matched rooms, Campus Vibe, Career Pathway — is built downstream of that one promise.
