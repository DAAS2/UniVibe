# **UniVibe — Full Product Plan & MVP Document**

## **Canva Hackathon | Student Belonging, Confidence & Future-Readiness Platform**

---

## **Executive Summary**

UniVibe is a pre-arrival and early-enrolment web platform that helps prospective and incoming university students feel genuine belonging, build confidence, and gain clarity about their future — *before* they set foot on campus. It directly addresses a documented epidemic: 1 in 4 students feel a sense of belonging at university, and 80% of Gen Z report feeling lonely in the past 12 months. Students don't choose universities based on rankings alone — they choose based on how a place *feels*. UniVibe makes that feeling tangible, personalised, and social.

The platform is built on **React / Next.js**, **Supabase** (database, auth, real-time), **Vercel** (deployment), and **Gemini AI** (personalisation, coaching, pathway generation).

---

## **Problem Space**

## **Why This Matters Now**

Gen Z is navigating a perfect storm of pressures. Despite being hyperconnected, three in ten young adults aged 16–29 report feeling lonely "some of the time," with low self-esteem (28%), social anxiety (24%), and mental health challenges cited as the leading drivers. Nearly 1 in 3 students feel they do not belong at university — a rate that directly mirrors loneliness prevalence. This isn't a niche welfare concern; loneliness affects belonging, psychological wellbeing, academic performance, and social identity.

At the same time, career paths are fracturing. A third of respondents aged 16–24 are uncertain about their desired career paths, and 81% of employers now agree that organisations should hire based on skills, not degrees. Gen Z is actively demanding non-linear, purpose-driven options — yet they lack the guidance to navigate them.

The result is a student who arrives on campus isolated, unsure, and overwhelmed — a gap that UniVibe is designed to close.

## **The Three Core Questions Students Are Asking**

1. *Will I find my people?* — Social belonging and identity  
2. *Will I feel safe and confident here?* — Emotional security and campus fit  
3. *Is it worth it for my future?* — Career confidence and ROI on their degree

---

## **Product Vision**

**"Feel it before you're there."**

UniVibe brings the lived university experience — the real moments, real people, and real futures — to students before Day 1\. It is not a brochure. It is not a chatbot FAQ. It is a personalised, AI-driven social discovery platform that mirrors how Gen Z actually wants to connect: authentically, peer-to-peer, and at their own pace.​

---

## **Solution Architecture**

## **How the Three Focus Areas Map to Features**

| Focus Area | Problem | UniVibe Feature |
| :---- | :---- | :---- |
| \#1 — Finding your people | Students don't know anyone pre-arrival | AI-matched interest groups \+ real-time group chat |
| \#2 — Feeling the uni experience | Marketing feels polished and fake | AI Campus Persona \+ real student story feed |
| \#3 — Career & non-linear futures | One-size-fits-all degree paths | AI-generated personal career pathway \+ micro-skills |

---

## **Feature Breakdown**

## **Feature 1 — Onboarding & AI Interest Discovery**

**What it does:** Upon signup, Gemini AI conducts a friendly, conversational onboarding interview — not a boring form — that gauges the student's interests, personality, learning style, social preferences, and career instincts. Think of it as a "get-to-know-you" chat that takes 3–5 minutes.

**Sample AI Prompts:**

* *"What's something you love doing that you've never been graded on?"*  
* *"When you picture your ideal Friday at uni — what does it look like?"*  
* *"If you had to pick a word for how you want to feel in your first week, what would it be?"*

**Output:** A personal profile card (visible to the student) with their top interests, personality tags (e.g. "Creative Connector", "Quiet Explorer", "Builder"), and a match score used to surface relevant groups and students.

**Tech:** Gemini API via @google/generative-ai SDK, structured output to Supabase profiles table.

---

## **Feature 2 — AI-Matched Interest Groups & Real-Time Chat**

**What it does:** Based on the onboarding, Gemini clusters students into interest-based micro-communities (e.g. "Sustainable Design Nerds", "First-Gen Uni Students", "Film & Philosophy Crowd"). Students can browse, join, and chat in real time.

**Why it works:** Finding a community that supports and cares for you makes a world of difference in managing the loneliness of early campus life. Research confirms that peer support and student interaction are among the highest-cited needs. Supabase Realtime's Broadcast and Presence features make this technically straightforward — it natively supports real-time messaging, typing indicators, and online presence tracking.

**Chat Rooms have two layers:**

* **Interest Rooms** — Broad topic clubs (e.g. Music, Coding, Mental Health)  
* **Cohort Rooms** — Students starting the same degree at the same uni, auto-created per intake year

**Tech:** Supabase Realtime Broadcast for messages, Supabase Presence for online status, Next.js Server Components \+ use client for UI. Rooms stored in channels table, messages in messages table with RLS (Row Level Security).​

---

## **Feature 3 — AI Campus Persona & "Feel the Uni" Experience**

**What it does:** Based on the student's enrolled (or shortlisted) university, Gemini generates a personalised "Campus Story" — a dynamic, narrative-driven experience that adapts to the student's profile. Instead of a generic brochure, the student sees a story tailored to *them*.

For a student interested in sustainability and introverted socialising at Monash, they'd see: Monash's Green Future Lab, the Monash Sustainability Institute, quieter campus spots, and quotes from students with similar profiles. Monash offers over 26,000 students more than 33,000 work-integrated learning experiences per year — UniVibe surfaces *the slice of that* most relevant to each student.​

**Components:**

* **Campus Vibe Map** — AI-curated snapshot of campus culture tailored to personality type  
* **Real Student Stories** — Short video/text cards from current students (seeded content for MVP, user-submitted later)  
* **"A Day In Your Life" Generator** — Gemini writes a personalised narrative of what a typical day might look like for *this* student at *this* uni  
* **Club & Event Recommendations** — Pulled from uni public data, ranked by interest match

**Tech:** Gemini text generation with university-specific context injection (system prompt contains uni profile data). University profiles stored in Supabase universities table. For MVP: Monash only, expandable to other unis post-hackathon.

---

## **Feature 4 — AI Career Pathway Builder**

**What it does:** The Career Pathway Builder is the answer to Gen Z's demand for non-linear career guidance. Rather than showing a single "Accounting → Big 4 → Senior Manager" path, Gemini generates a personalised, branching career map based on the student's interests, degree, and values.

**Flow:**

1. Student selects or confirms their degree (or says "I don't know yet")  
2. Gemini asks 3–5 career values questions ("Do you want to work remotely? Do you want creative freedom? Do you care more about impact or income?")  
3. Output: A visual pathway card showing **3 possible futures** — traditional, hybrid, and non-linear — with specific roles, skills needed, and real companies that hire for each  
4. Each path has a **Micro-Skill Module** — a 5-question Gemini-powered mini-lesson that introduces one relevant skill (e.g. "What is UX Research?", "Intro to Data Storytelling")

**Why this resonates:** 75% of surveyed youth said enhanced access to career information would help them find direction. The Gemini Guided Learning model — using questions and step-by-step breakdowns that adapt to the user — is the exact pattern to replicate here.

**Tech:** Gemini API with structured JSON output (pathway cards), stored in Supabase pathways table. Micro-skill modules are dynamically generated per skill topic. React component renders pathway as an interactive card tree.

---

## **Technical Architecture**

## **Stack Overview**

| Layer | Technology | Purpose |
| :---- | :---- | :---- |
| Frontend | React \+ Next.js 14 (App Router) | UI, routing, SSR/SSG |
| Styling | Tailwind CSS \+ shadcn/ui | Component library |
| Backend | Next.js API Routes \+ Server Actions | Business logic |
| Database | Supabase PostgreSQL | All data persistence |
| Auth | Supabase Auth (email \+ Google OAuth) | User authentication |
| Real-time | Supabase Realtime (Broadcast \+ Presence) | Live chat, online status |
| AI | Gemini 1.5 Flash (via Google AI SDK) | Onboarding, content gen, pathways |
| Deployment | Vercel | Hosting \+ Edge Functions |

## **Database Schema (Core Tables)**

sql

*`-- Users & Profiles`*

`profiles (id, user_id, university_id, display_name, avatar_url, personality_tags[],` 

          `interests[], degree, intake_year, onboarding_complete, created_at)`

*`-- Universities`*

`universities (id, name, slug, description, campus_data jsonb, created_at)`

*`-- Interest Groups / Channels`*

`channels (id, name, description, university_id, type [interest|cohort],` 

          `tags[], member_count, created_by, created_at)`

*`-- Real-time Messages`*

`messages (id, channel_id, user_id, content, created_at)`

*`-- Career Pathways`*

`pathways (id, user_id, degree, career_values jsonb, paths jsonb,` 

          `generated_at, updated_at)`

*`-- Micro-skill Progress`*

`skill_progress (id, user_id, skill_topic, questions_answered,` 

                `completed, created_at)`

## **AI Integration Pattern**

text

`User Input → Next.js API Route → Gemini Flash API`

     `↓`

`Structured JSON Response → Supabase Write → React State Update`

Use response\_mime\_type: "application/json" with Gemini for reliable structured output. Keep system prompts university-specific using a prompt injection layer that pulls from the universities table.

## **Real-time Chat Architecture**

Supabase Realtime handles the full chat layer:

* **Broadcast** for message delivery between clients  
* **Presence** to show who is online in a room  
* **Postgres Changes** to sync message history on load

Pattern: supabase.channel('room:${channelId}').on('broadcast', ...) with optimistic UI updates on the client.

---

## **User Journey (End-to-End)**

text

`1. LANDING PAGE`

   `↓ Hero: "Find your people. Feel your future."`

   `↓ CTA: "Start your journey" → Sign Up`

`2. AUTH (Supabase email or Google OAuth)`

   `↓`

`3. ONBOARDING CHAT (Gemini)`

   `↓ 5–7 conversational questions`

   `↓ Profile + personality tags generated`

   `↓ University confirmed / selected`

`4. HOME DASHBOARD`

   `├── "Your Campus Vibe" card (Feature 3)`

   `├── "People like you are in these groups" (Feature 2)`

   `├── "Your career paths" preview (Feature 4)`

   `└── "A day in your life at [Uni]" narrative`

`5. GROUPS & CHAT`

   `↓ Browse and join interest/cohort rooms`

   `↓ Real-time chat with presence indicators`

`6. CAREER PATHWAY`

   `↓ Complete values questionnaire`

   `↓ View 3-path career map`

   `↓ Pick a path → Start micro-skill module`

`7. ONGOING ENGAGEMENT`

   `↓ New students joining → notifications`

   `↓ Pathway updates as they progress`

   `↓ Uni events surfaced via Campus Vibe`

---

## **MVP Scope**

## **What's In (Hackathon Deliverable)**

The MVP focuses on proving the core emotional loop: *student feels seen → student feels connected → student feels hopeful about their future*.

| Feature | MVP Scope | Notes |
| :---- | :---- | :---- |
| Auth & Profiles | ✅ Full | Email \+ Google OAuth via Supabase |
| Gemini Onboarding Chat | ✅ Full | 5–7 questions, structured output |
| Personality Tags & Profile Card | ✅ Full | Visual display post-onboarding |
| Interest Group Browsing | ✅ Full | Pre-seeded groups for demo |
| Real-time Chat (Groups) | ✅ Full | Supabase Realtime Broadcast |
| Online Presence Indicators | ✅ Full | Supabase Presence |
| Campus Vibe (Monash only) | ✅ Full | Gemini \+ hardcoded uni profile |
| "A Day In Your Life" Generator | ✅ Full | Gemini text gen |
| Career Pathway Builder | ✅ Core | 3 paths generated by Gemini |
| Micro-Skill Modules | ✅ 1 demo skill | Expandable post-hackathon |
| Multi-university support | ⏳ Post-MVP | Architecture supports it |
| Student Story Feed (user-submitted) | ⏳ Post-MVP | Seed with static content for demo |
| Mobile App | ⏳ Post-MVP | Responsive web for now |

## **What's Out (Post-Hackathon Roadmap)**

* Push notifications  
* Full university partner API integrations  
* Student-submitted video stories  
* In-app mentorship matching  
* LMS / calendar integrations  
* Analytics dashboard for universities

---

## **MVP Build Plan (Hackathon Timeline)**

## **Suggested Sprint (24–48 hours)**

| Phase | Time | Tasks |
| :---- | :---- | :---- |
| **Setup** | 0–2h | Init Next.js \+ Supabase project, Vercel deploy, env vars, auth config |
| **Database** | 2–4h | Create all tables, RLS policies, seed university data (Monash), seed 6 interest channels |
| **Auth \+ Onboarding** | 4–8h | Auth UI, Gemini onboarding chat component, profile write to Supabase |
| **Dashboard \+ Campus Vibe** | 8–12h | Home dashboard layout, Gemini campus narrative, personality card display |
| **Groups \+ Chat** | 12–18h | Channel browser, real-time chat UI, Supabase Realtime integration, Presence |
| **Career Pathway** | 18–22h | Values questionnaire, Gemini pathway generator, 3-path card UI |
| **Micro-skill Module** | 22–24h | One skill topic, Gemini Q\&A flow, progress tracking |
| **Polish \+ Demo Prep** | 24–26h | UI polish, demo data, Vercel deploy, walkthrough script |

---

## **Key Screens & UI Notes**

## **1\. Onboarding Chat Screen**

* Full-screen conversational UI, dark/warm gradient background  
* AI "avatar" (animated orb or character) on one side, message bubbles on the other  
* Progress dots at the top showing question 1/7 etc.  
* Feels like texting a curious, warm friend — not filling out a form

## **2\. Home Dashboard**

* Card-based layout (3 columns on desktop, stack on mobile)  
* Hero card: "Your Campus Vibe at Monash" — illustrated/AI-described narrative  
* Below: "People in your orbit" (matched group previews with member avatars)  
* Below: "Your futures" — teaser card of career path  
* Soft, warm colour palette — not clinical blue/white

## **3\. Group Chat**

* Left sidebar: list of joined \+ recommended channels  
* Main: message feed with timestamps \+ avatars  
* Presence bar at top: "3 people online in this room"  
* No algorithmic feed — pure chronological. Authenticity \> polish​

## **4\. Career Pathway Card**

* Three columns: "Traditional", "Hybrid", "Non-Linear"  
* Each column: Role title → Skills needed → Companies → Micro-skill CTA button  
* Visual connecting lines between steps  
* Encouraging framing: "All of these are real paths people have taken"

---

## **AI Prompting Strategy**

## **Onboarding System Prompt**

text

`You are a warm, curious friend helping a new university student discover` 

`who they are and what they want. Ask one question at a time.` 

`Keep each question conversational and under 20 words.` 

`After {n} questions, return a JSON object with:` 

`{ personality_tags: [], interests: [], social_style: "", career_values: [] }`

## **Campus Vibe System Prompt**

text

`You are a storytelling guide for {university_name}.` 

`The student's profile: interests={interests}, personality={tags}, degree={degree}.`

`Write a 150-word personalised narrative describing what their campus life` 

`could feel like — specific, warm, and honest.` 

`Reference real programs, spaces, and communities at {university_name}.`

## **Career Pathway System Prompt**

text

`You are a non-judgmental career coach for Gen Z students.`

`Student degree: {degree}. Values: {values}. Interests: {interests}.`

`Return a JSON with 3 career paths: traditional, hybrid, non_linear.`

`Each path: { title, description, roles: [], skills: [], companies: [],` 

`micro_skill_topic: "" }`

`Emphasise that non-linear paths are valid and increasingly common.`

---

## **Why This Wins the Hackathon**

## **Against the Judging Criteria**

| Criterion | UniVibe's Answer |
| :---- | :---- |
| **Relevance to problem** | Directly addresses all 3 focus areas; grounded in real Gen Z data |
| **Use of AI** | Gemini powers 3 distinct, non-trivial experiences: onboarding, campus narrative, and career generation |
| **Technical execution** | Full-stack: Next.js \+ Supabase \+ Vercel \+ Gemini, real-time features, proper DB schema |
| **User experience** | Warm, conversational, anti-polished — matches Gen Z's backlash against corporate digital experiences​ |
| **Innovation** | Not a FAQ bot or virtual tour — a *social discovery platform* with AI-matched belonging |
| **Scalability** | Architecture supports multi-university expansion; DB schema designed for it |

## **The Emotional Pitch (for your demo)**

*"Every student has two questions when they pick a university: 'Will I belong here?' and 'Will it be worth it?' Right now, there's no good answer to either — just glossy brochures and league tables. UniVibe changes that. Before you arrive, you meet people like you, you see your future there, and you find paths you didn't know existed. We're not selling the university. We're helping students feel it."*

---

## **Risks & Mitigations**

| Risk | Mitigation |
| :---- | :---- |

| Risk | Mitigation |
| :---- | :---- |
| Gemini API latency on onboarding | Use streaming responses (generateContentStream) for perceived speed |
| Real-time chat scaling | Supabase Realtime handles this natively at hackathon scale​ |
| Cold start (no users in groups) | Pre-seed demo accounts and messages in Supabase for the demo |
| AI hallucinating uni data | Inject verified university facts as system prompt context; never ask Gemini to recall facts from training |
| Scope creep | Strictly follow MVP table above; post-MVP backlog is clearly defined |

---

## **Post-Hackathon Vision**

If productised, UniVibe becomes the **pre-enrolment layer** that universities license to onboard incoming students 3–6 months before O-Week. Revenue model: B2B SaaS per-university license, with a freemium student-facing tier. The platform's value compounds as more students join — each new profile improves group matching quality, and each career story submitted enriches the data set. The long-term vision is a network effect: by the time a student arrives on Day 1, they already have friends, a roadmap, and a reason to be excited.

