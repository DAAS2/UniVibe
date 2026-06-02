// ----------------------------------------------------------------------------
// UniVibe — Career Pathway Builder.
//
// Takes a degree + 3-5 career-values answers and produces 3 paths:
//   Traditional, Hybrid, Non-Linear.
// Each path: title, description, roles[], skills[], companies[], micro_skill_topic.
//
// Tries Gemini first if GEMINI_API_KEY is set; falls back to a deterministic
// generator that mixes a small role/skill/company catalog by degree + values.
// ----------------------------------------------------------------------------

import { z } from "zod";

export const careerPayloadSchema = z.object({
  degree: z.string().min(1).max(120),
  values: z.array(z.string().min(1).max(280)).min(3).max(6),
});

export type CareerPayload = z.infer<typeof careerPayloadSchema>;

export interface CareerPath {
  kind: "traditional" | "hybrid" | "non_linear";
  title: string;
  description: string;
  roles: string[];
  skills: string[];
  companies: string[];
  micro_skill_topic: string;
}

export interface CareerResult {
  degree: string;
  paths: CareerPath[];
  encouragement: string;
  source: "gemini" | "fallback";
}

// ----------------------------------------------------------------------------
// Degree → role/skill/company seeds. Plain data; trivially extensible.
// ----------------------------------------------------------------------------
interface DegreeSeed {
  matchers: RegExp[];
  traditional: { roles: string[]; companies: string[] };
  hybrid:      { roles: string[]; companies: string[] };
  nonLinear:   { roles: string[]; companies: string[] };
  coreSkills: string[];
  microTopics: { traditional: string; hybrid: string; nonLinear: string };
}

const DEGREE_SEEDS: DegreeSeed[] = [
  {
    matchers: [/design/i, /architecture/i, /mada/i, /communication/i],
    traditional: {
      roles: ["Visual Designer", "UI Designer", "Brand Designer"],
      companies: ["Frost*", "Hulsbosch", "Re Agency", "Cox Architecture"],
    },
    hybrid: {
      roles: ["Product Designer", "Design Engineer", "Design Researcher"],
      companies: ["Canva", "Atlassian", "Linear", "Figma"],
    },
    nonLinear: {
      roles: ["Independent Studio Founder", "Creative Director (own client list)", "Design Educator"],
      companies: ["Self-employed", "Small studio collective", "Substack/Patreon-funded practice"],
    },
    coreSkills: ["Visual systems", "Typography", "Prototyping (Figma)", "Critique & feedback"],
    microTopics: {
      traditional: "Build a 3-screen Figma case study",
      hybrid: "Ship a working prototype with React + Figma tokens",
      nonLinear: "Write a paid newsletter about your design practice",
    },
  },
  {
    matchers: [/computer/i, /software/i, /engineering/i, /it\b/i, /information tech/i, /data/i, /science/i],
    traditional: {
      roles: ["Software Engineer", "Backend Engineer", "Data Analyst"],
      companies: ["Atlassian", "Canva", "REA Group", "NAB", "Telstra"],
    },
    hybrid: {
      roles: ["Developer Advocate", "Product Engineer", "ML Engineer", "Solutions Engineer"],
      companies: ["Linear", "Vercel", "Anthropic", "Notion", "Cloudflare"],
    },
    nonLinear: {
      roles: ["Indie Hacker", "Open-source maintainer", "Technical Writer", "AI consultant"],
      companies: ["Solo / micro-SaaS", "GitHub Sponsors", "Substack", "Boutique consultancy"],
    },
    coreSkills: ["Reading other people's code", "Writing tests", "Async communication", "Naming things well"],
    microTopics: {
      traditional: "Pass a system-design walkthrough in 30 minutes",
      hybrid: "Ship a side-project that 10 strangers use",
      nonLinear: "Launch a $5/month micro-SaaS in a weekend",
    },
  },
  {
    matchers: [/business/i, /commerce/i, /management/i, /marketing/i, /finance/i, /economics/i],
    traditional: {
      roles: ["Analyst (Strategy)", "Marketing Coordinator", "Finance Graduate"],
      companies: ["Bain", "Deloitte", "Macquarie", "Coles Group", "ANZ"],
    },
    hybrid: {
      roles: ["Product Marketing Manager", "Growth Analyst", "Operations at a startup"],
      companies: ["Canva", "SafetyCulture", "Airwallex", "Culture Amp"],
    },
    nonLinear: {
      roles: ["Newsletter operator", "Independent strategist", "Niche community builder"],
      companies: ["Solo brand", "Beehiiv/Substack", "Boutique advisory"],
    },
    coreSkills: ["Plain-English writing", "Reading a P&L", "Asking better questions", "Saying no kindly"],
    microTopics: {
      traditional: "Build a 1-page strategy memo a senior leader would actually read",
      hybrid: "Run a 14-day growth experiment end-to-end",
      nonLinear: "Reach 100 paying readers for a niche newsletter",
    },
  },
  {
    matchers: [/arts/i, /humanities/i, /english/i, /history/i, /politics/i, /philosophy/i, /literature/i, /journalism/i, /media/i],
    traditional: {
      roles: ["Editorial Assistant", "Policy Researcher", "Communications Officer"],
      companies: ["ABC", "The Guardian Australia", "Federal Government", "Penguin Random House"],
    },
    hybrid: {
      roles: ["Content Strategist", "Brand Writer", "Podcast Producer"],
      companies: ["Stripe Press", "Atlassian", "Acast", "Schwartz Media"],
    },
    nonLinear: {
      roles: ["Independent essayist", "Documentary maker", "Cultural critic on Substack"],
      companies: ["Self-published", "Patreon", "Festival commissions"],
    },
    coreSkills: ["Editing your own writing", "Long-form research", "Interviewing strangers warmly", "Pitching"],
    microTopics: {
      traditional: "Pitch a piece to a real publication this month",
      hybrid: "Ghost-write a 2,000-word brand piece",
      nonLinear: "Publish a 6-essay free Substack and find your first 50 readers",
    },
  },
  {
    matchers: [/science/i, /biomed/i, /pharm/i, /health/i, /psych/i, /nurs/i, /medic/i, /environment/i, /biology/i, /chem/i],
    traditional: {
      roles: ["Lab Researcher", "Clinical Assistant", "Public Health Officer"],
      companies: ["CSIRO", "Walter+Eliza Hall Institute", "Monash Health", "Department of Health"],
    },
    hybrid: {
      roles: ["Science Communicator", "Health Product Manager", "Bioinformatics Analyst"],
      companies: ["CSL", "Cochlear", "ResMed", "Bupa Health"],
    },
    nonLinear: {
      roles: ["Independent science writer", "Health-tech co-founder", "Educator on YouTube"],
      companies: ["Solo practice", "Substack", "Small spin-out"],
    },
    coreSkills: ["Reading a paper critically", "Explaining without dumbing down", "Designing a fair experiment"],
    microTopics: {
      traditional: "Summarise a paper in 250 words a non-scientist will love",
      hybrid: "Build a public dashboard from one open dataset",
      nonLinear: "Publish a 10-minute explainer video on a niche topic",
    },
  },
  // Default fallback used if no matcher hits.
  {
    matchers: [/.*/],
    traditional: {
      roles: ["Graduate Programme entry", "Junior specialist", "Associate"],
      companies: ["Top-tier graduate employer in your sector"],
    },
    hybrid: {
      roles: ["Generalist at a small company", "Project-based contractor", "In-house specialist"],
      companies: ["Australian scale-ups (50-500 people)"],
    },
    nonLinear: {
      roles: ["Build your own thing", "Freelance + portfolio", "Project hopper"],
      companies: ["You", "A small collective", "Whoever pays you for the work"],
    },
    coreSkills: ["Writing clearly", "Asking better questions", "Following up", "Saying no kindly"],
    microTopics: {
      traditional: "Land your first informational coffee chat",
      hybrid: "Run a 2-week experiment that proves a small skill",
      nonLinear: "Ship a tiny project you can show a stranger",
    },
  },
];

function seedForDegree(degree: string): DegreeSeed {
  for (const s of DEGREE_SEEDS) {
    if (s.matchers.some((m) => m.test(degree))) return s;
  }
  return DEGREE_SEEDS[DEGREE_SEEDS.length - 1];
}

// Map keywords in values → extra skills (sprinkle, not replace).
function valuesToSkills(values: string[]): string[] {
  const blob = values.join(" \n ").toLowerCase();
  const extra: string[] = [];
  if (/impact|help|community|people|world/.test(blob)) extra.push("Stakeholder empathy");
  if (/money|stable|stability|secure/.test(blob)) extra.push("Financial literacy");
  if (/free|flex|autonom|own boss|time/.test(blob)) extra.push("Self-management & focus");
  if (/creative|make|build|design|art/.test(blob)) extra.push("Craft & taste");
  if (/learn|grow|curious|change/.test(blob)) extra.push("Deliberate practice habits");
  if (/team|collab|together/.test(blob)) extra.push("Collaboration & feedback");
  return Array.from(new Set(extra));
}

async function tryGeminiCareer(payload: CareerPayload): Promise<CareerResult | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    // @ts-ignore — optional dependency
    const mod = await import("@google/generative-ai").catch(() => null);
    if (!mod) return null;
    const { GoogleGenerativeAI } = mod;
    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });
    const prompt = `You are UniVibe's warm career mentor. A university student studying ${payload.degree} answered:
${payload.values.map((v, i) => `${i + 1}. ${v}`).join("\n")}

Generate exactly 3 career paths. Return ONLY this JSON (no prose):
{
  "paths": [
    {
      "kind": "traditional",
      "title": "short title",
      "description": "2-3 warm sentences, second person ('you'), anti-corporate, no hype",
      "roles": ["3-5 role titles"],
      "skills": ["4-6 concrete skills"],
      "companies": ["4-6 example companies — mix Australian + global if degree allows"],
      "micro_skill_topic": "a single concrete skill they could practice in 1-2 weeks"
    },
    { "kind": "hybrid", ... same shape },
    { "kind": "non_linear", ... same shape }
  ],
  "encouragement": "1-2 sentence warm closer, peer-to-peer, no emoji"
}`;
    const resp = await model.generateContent(prompt);
    const text = resp.response.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.paths) || parsed.paths.length < 3) return null;
    const allowed = ["traditional", "hybrid", "non_linear"] as const;
    const paths: CareerPath[] = allowed.map((kind) => {
      const p = parsed.paths.find((x: any) => x.kind === kind) ?? parsed.paths[0];
      return {
        kind,
        title: p.title ?? "Path",
        description: p.description ?? "",
        roles: Array.isArray(p.roles) ? p.roles : [],
        skills: Array.isArray(p.skills) ? p.skills : [],
        companies: Array.isArray(p.companies) ? p.companies : [],
        micro_skill_topic: p.micro_skill_topic ?? "Practice one concrete skill this week",
      };
    });
    return {
      degree: payload.degree,
      paths,
      encouragement: parsed.encouragement ?? "There isn't one right shape for a career. Take the one that fits this year — the next one can look different.",
      source: "gemini",
    };
  } catch (err) {
    console.warn("[career] Gemini call failed, falling back:", err);
    return null;
  }
}

function deterministicCareer(payload: CareerPayload): CareerResult {
  const seed = seedForDegree(payload.degree);
  const extraSkills = valuesToSkills(payload.values);
  const baseSkills = seed.coreSkills;
  const skills = Array.from(new Set([...baseSkills, ...extraSkills])).slice(0, 6);

  const paths: CareerPath[] = [
    {
      kind: "traditional",
      title: "The Traditional Path",
      description:
        "The well-marked road. Graduate programmes, named employers, predictable progression. You're not playing it safe — you're choosing structure on purpose, and using that structure to build judgment.",
      roles: seed.traditional.roles,
      skills,
      companies: seed.traditional.companies,
      micro_skill_topic: seed.microTopics.traditional,
    },
    {
      kind: "hybrid",
      title: "The Hybrid Path",
      description:
        "Half the structure, twice the surface area. You join a small company or a growing team where you'll touch a wider remit and ship faster. Less prestige, more compounding skill.",
      roles: seed.hybrid.roles,
      skills,
      companies: seed.hybrid.companies,
      micro_skill_topic: seed.microTopics.hybrid,
    },
    {
      kind: "non_linear",
      title: "The Non-Linear Path",
      description:
        "Build your own shape. Independent work, projects you own, audiences you grow. Slower money at first, faster identity later. Reserved for people who genuinely don't fit the boxes — and that's not most people, but it might be you.",
      roles: seed.nonLinear.roles,
      skills,
      companies: seed.nonLinear.companies,
      micro_skill_topic: seed.microTopics.nonLinear,
    },
  ];

  return {
    degree: payload.degree,
    paths,
    encouragement:
      "There isn't one right shape for a career. Pick the one that fits this year — the next one can look completely different.",
    source: "fallback",
  };
}

export async function generateCareerPaths(payload: CareerPayload): Promise<CareerResult> {
  const fromAI = await tryGeminiCareer(payload);
  return fromAI ?? deterministicCareer(payload);
}

// ----------------------------------------------------------------------------
// Micro-skill mini-lesson generator. 5 questions, mix of quick reflections
// + multiple-choice "vibe checks". Returned to the client and tracked in
// React state (no localStorage). Completion can be persisted server-side
// later — for MVP, completion is just an in-memory ack endpoint.
// ----------------------------------------------------------------------------
export const microSkillRequestSchema = z.object({
  topic: z.string().min(2).max(160),
  degree: z.string().min(1).max(120).optional(),
});

export interface MicroSkillStep {
  index: number;
  kind: "reflect" | "choice";
  prompt: string;
  options?: string[];        // present when kind === "choice"
  hint?: string;
}

export interface MicroSkillLesson {
  topic: string;
  intro: string;
  steps: MicroSkillStep[];   // exactly 5
  outro: string;
  source: "gemini" | "fallback";
}

async function tryGeminiMicroSkill(topic: string, degree?: string): Promise<MicroSkillLesson | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    // @ts-ignore — optional dependency
    const mod = await import("@google/generative-ai").catch(() => null);
    if (!mod) return null;
    const { GoogleGenerativeAI } = mod;
    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });
    const prompt = `Design a 5-step mini-lesson for a university student${
      degree ? ` studying ${degree}` : ""
    } on the topic: "${topic}".

Voice: warm, peer-to-peer, second person, anti-corporate, no hype, no emoji.

Return ONLY this JSON:
{
  "intro": "1-2 sentence warm framing of why this skill matters",
  "steps": [
    {
      "index": 1,
      "kind": "reflect" | "choice",
      "prompt": "the question",
      "options": ["only if kind === choice, 3-4 short plausible options"],
      "hint": "one sentence of teaching after they answer"
    },
    ... exactly 5 steps total, mix of reflect + choice
  ],
  "outro": "1-2 sentence warm closer + suggested tiny next action"
}`;
    const resp = await model.generateContent(prompt);
    const text = resp.response.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.steps) || parsed.steps.length !== 5) return null;
    return {
      topic,
      intro: parsed.intro ?? "",
      steps: parsed.steps.map((s: any, i: number) => ({
        index: i + 1,
        kind: s.kind === "choice" ? "choice" : "reflect",
        prompt: s.prompt ?? "",
        options: Array.isArray(s.options) ? s.options : undefined,
        hint: s.hint ?? "",
      })),
      outro: parsed.outro ?? "Tiny reps beat big plans. Do it once this week.",
      source: "gemini",
    };
  } catch (err) {
    console.warn("[micro-skill] Gemini call failed, falling back:", err);
    return null;
  }
}

function deterministicMicroSkill(topic: string, degree?: string): MicroSkillLesson {
  const t = topic.toLowerCase();
  const intro = `${topic} is one of those skills that compounds quietly — small reps, big interest rate. Here's a 5-step warm-up.`;
  const steps: MicroSkillStep[] = [
    {
      index: 1,
      kind: "reflect",
      prompt: `In your own words, what does "${topic}" actually mean to you right now?`,
      hint:
        "Naming it in your own words is half the work. The textbook definition matters less than the version you'd say to a friend.",
    },
    {
      index: 2,
      kind: "choice",
      prompt: "Which of these would be the highest-leverage first rep this week?",
      options: [
        "Spend 30 minutes studying how someone good at this does it",
        "Just attempt a tiny version of it once",
        "Read three articles about it",
        "Ask someone who's done it for 15 minutes of their time",
      ],
      hint:
        "Option 2 and 4 almost always beat 1 and 3. Doing tiny + asking a person both create the feedback that articles can't.",
    },
    {
      index: 3,
      kind: "reflect",
      prompt: "What's one specific thing you'll do in the next 7 days? Be small and specific.",
      hint:
        "If your answer fits in a calendar invite, you're on track. \"Get better at X\" doesn't fit. \"Write 200 words about X on Wednesday morning\" does.",
    },
    {
      index: 4,
      kind: "choice",
      prompt: "When you almost certainly hit a wall mid-week, what's the kindest next move?",
      options: [
        "Push through and grind harder",
        "Stop, shrink the rep by 50%, and do that instead",
        "Skip the week and try again next month",
        "Ask one person for one specific question",
      ],
      hint:
        "Shrinking the rep (option 2) is the most underrated skill in adult learning. \"Smaller, sooner\" beats \"bigger, eventually\".",
    },
    {
      index: 5,
      kind: "reflect",
      prompt: "Who will you tell about this — not to be impressive, but so it's real?",
      hint:
        "Telling one person quietly is the cheapest commitment device that exists. You don't need a public goal — just a witness.",
    },
  ];
  const outro =
    degree
      ? `That's it — five steps that travel well for a ${degree} student. Save this, do the rep, come back next week and run it again.`
      : "That's it. Five steps, tiny rep, one witness. Run it again next week with the same topic.";
  return { topic, intro, steps, outro, source: "fallback" };
}

export async function generateMicroSkillLesson(
  topic: string,
  degree?: string,
): Promise<MicroSkillLesson> {
  const fromAI = await tryGeminiMicroSkill(topic, degree);
  return fromAI ?? deterministicMicroSkill(topic, degree);
}
