# UniVibe

> **Feel it before you're there.**

UniVibe is a pre-arrival and early-enrolment web platform that helps prospective and incoming university students feel genuine belonging, build confidence, and gain clarity about their future — *before* they set foot on campus.

Built for the **Canva Hackathon** to address student belonging, confidence, and future-readiness.

---

## The Problem

- **1 in 4** students feel a sense of belonging at university
- **80%** of Gen Z report feeling lonely in the past 12 months
- **1 in 3** students feel they do not belong at university
- **81%** of employers now hire based on skills, not degrees — yet students lack guidance on non-linear paths

Students don't choose universities based on rankings alone — they choose based on how a place **feels**. UniVibe makes that feeling tangible, personalised, and social.

---

## Features

### 1. AI Onboarding & Interest Discovery
A warm, conversational onboarding interview (not a boring form) that gauges interests, personality, learning style, and career instincts. Generates a personal profile card with personality tags like "Creative Connector", "Quiet Explorer", or "Builder".

### 2. AI-Matched Interest Groups & Real-Time Chat
Students are clustered into interest-based micro-communities (e.g. "Sustainable Design Nerds", "First-Gen Uni Students"). Browse, join, and chat in real time with presence indicators.

- **Interest Rooms** — Broad topic clubs (Music, Coding, Mental Health)
- **Cohort Rooms** — Students starting the same degree at the same uni

### 3. AI Campus Persona & "Feel the Uni" Experience
A personalised "Campus Story" tailored to each student's profile. Instead of a generic brochure, see a narrative describing what campus life could feel like — specific programs, spaces, and communities.

- Campus Vibe Map
- Real Student Stories
- "A Day In Your Life" Generator
- Club & Event Recommendations

### 4. AI Career Pathway Builder
Generates a personalised, branching career map with three possible futures:
- **Traditional** — Standard career progression
- **Hybrid** — Mixed skill-set roles
- **Non-Linear** — Portfolio career / entrepreneurship paths

Each path includes specific roles, skills needed, real companies, and a **Micro-Skill Module** — a 5-question mini-lesson to introduce a relevant skill.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes + Server Actions |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email + Google OAuth) |
| Real-time | Supabase Realtime (Broadcast + Presence) |
| AI | Gemini 1.5 Flash (via Google AI SDK) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm
- A Supabase project
- A Google AI (Gemini) API key

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd canva-app

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

### Database Setup

Run the following SQL in your Supabase SQL Editor to create the core tables:

```sql
-- Users & Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  university_id UUID REFERENCES universities(id),
  display_name TEXT,
  avatar_url TEXT,
  personality_tags TEXT[],
  interests TEXT[],
  degree TEXT,
  intake_year INTEGER,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Universities
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  campus_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interest Groups / Channels
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  university_id UUID REFERENCES universities(id),
  type TEXT CHECK (type IN ('interest', 'cohort')),
  tags TEXT[],
  member_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Career Pathways
CREATE TABLE pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  degree TEXT,
  career_values JSONB,
  paths JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Micro-skill Progress
CREATE TABLE skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  skill_topic TEXT NOT NULL,
  questions_answered INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Enable Row Level Security (RLS)

After creating the tables, enable RLS and add basic policies:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read channels" ON channels
  FOR SELECT USING (true);

CREATE POLICY "Users can read messages in joined channels" ON messages
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own pathways" ON pathways
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own skill progress" ON skill_progress
  FOR SELECT USING (auth.uid() = user_id);
```

#### Enable Realtime

For the chat feature to work, enable Realtime on the `messages` table:
1. Go to your Supabase Dashboard → Database → Replication
2. Toggle **Realtime** for the `messages` table

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

### Deploy on Vercel

The easiest way to deploy is via the [Vercel Platform](https://vercel.com/new). Link your GitHub repo and add your environment variables in the Vercel dashboard.

---

## Project Structure

```
canva-app/
├── app/                   # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home dashboard
│   └── globals.css        # Global styles
├── utils/                 # Utilities
│   └── supabase/          # Supabase clients
│       ├── client.ts      # Browser client
│       └── server.ts      # Server client
├── middleware.ts          # Auth session refresh (do not remove)
├── next.config.ts         # Next.js config
├── tsconfig.json          # TypeScript config
└── package.json
```

Planned directories (to be created as features are built):
- `components/` — React components (onboarding, chat, campus-vibe, career-pathway)
- `lib/` — Business logic (Gemini AI integration, etc.)

---

## User Journey

1. **Landing Page** — "Find your people. Feel your future."
2. **Auth** — Sign up with email or Google OAuth
3. **Onboarding Chat** — 5-7 conversational questions with Gemini
4. **Home Dashboard** — Campus Vibe, matched groups, career preview
5. **Groups & Chat** — Browse, join, and chat in real time
6. **Career Pathway** — Complete values quiz, view 3-path career map
7. **Micro-Skills** — Start a mini-lesson on a relevant skill

---

## Key Design Principles

- **Warm, not clinical** — Soft colour palette, conversational UI
- **Authentic, not polished** — Peer-to-peer connections, real student stories
- **Personal, not generic** — AI-tailored to each student's profile
- **Hopeful, not anxious** — Career paths framed as possibilities, not pressure

---

## License

[MIT](LICENSE)
