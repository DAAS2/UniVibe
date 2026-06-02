// ----------------------------------------------------------------------------
// UniVibe AI module.
//
// Provides two functions:
//   - generateProfile(answers): produce personality tags, interests, social
//     style, student archetype, summary, match seed.
//   - generateGroups(profile): produce 5–6 recommended rooms.
//
// Both attempt a Gemini call first if GEMINI_API_KEY is set; otherwise they
// fall back to a deterministic generator so the demo always works.
//
// To enable Gemini:
//   1. npm i @google/generative-ai
//   2. export GEMINI_API_KEY=...
// The fallback below is intentionally rich enough to demo without keys.
// ----------------------------------------------------------------------------

import type { OnboardingAnswer, HydratedProfile, Room } from "@shared/schema";

// Simple string hash → seed
function hashSeed(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

// Keyword → tag mapping. Crude but warm.
const TAG_MAP: Array<{ kw: RegExp; tag: string; interest?: string }> = [
  { kw: /\b(draw|sketch|paint|design|illustrat|graphic)/i, tag: "Creative", interest: "Design" },
  { kw: /\b(music|sing|guitar|piano|playlist|gig|concert|band)/i, tag: "Music-tuned", interest: "Music" },
  { kw: /\b(film|movie|cinema|director|screenplay)/i, tag: "Cinephile", interest: "Film" },
  { kw: /\b(read|book|novel|poetry|philosophy)/i, tag: "Bookish", interest: "Books & Ideas" },
  { kw: /\b(code|coding|hack|build|maker|startup|founder|robot|tech)/i, tag: "Builder", interest: "Builders & Hackers" },
  { kw: /\b(sport|run|gym|climb|skate|surf|football|soccer|basketball)/i, tag: "Active", interest: "Active Life" },
  { kw: /\b(climate|sustain|enviro|green|eco|plant|garden)/i, tag: "Earth-minded", interest: "Sustainability" },
  { kw: /\b(cook|bake|food|recipe|restaurant)/i, tag: "Food-curious", interest: "Food & Cooking" },
  { kw: /\b(quiet|chill|cozy|home|introvert|calm|alone)/i, tag: "Quietly social", interest: "Quiet Hangouts" },
  { kw: /\b(party|loud|dance|night|club|outgoing|extrovert)/i, tag: "Lively", interest: "Nightlife" },
  { kw: /\b(volunteer|community|help|social|activis)/i, tag: "Community-driven", interest: "Community & Activism" },
  { kw: /\b(travel|hike|explore|adventure|backpack)/i, tag: "Wanderer", interest: "Travel & Outdoors" },
  { kw: /\b(game|gaming|console|esports|minecraft)/i, tag: "Gamer", interest: "Gaming" },
  { kw: /\b(first[- ]gen|first generation|first in family)/i, tag: "First-Gen", interest: "First-Gen Network" },
  { kw: /\b(anxious|nervous|scared|overwhelm|worry)/i, tag: "Brave-curious" },
  { kw: /\b(seen|connect|belong|friend|people|together)/i, tag: "Belonging-seeking" },
  { kw: /\b(focus|study|library|grind|productiv)/i, tag: "Focused", interest: "Study Circles" },
  { kw: /\b(write|writer|journal|essay|poetry)/i, tag: "Writerly", interest: "Writers' Room" },
  { kw: /\b(photo|camera|polaroid|disposable)/i, tag: "Image-maker", interest: "Photography" },
];

const ARCHETYPES = [
  { name: "The Quiet Connector", match: ["Quietly social", "Bookish", "Focused"], summary: "You'll find your people in small, intentional rooms — not loud crowds." },
  { name: "The Builder", match: ["Builder", "Creative"], summary: "You make things to think. You'll thrive with project people." },
  { name: "The Open-Hearted Explorer", match: ["Wanderer", "Lively", "Community-driven"], summary: "You're here to be changed, not to perform. People feel that." },
  { name: "The Creative Romantic", match: ["Cinephile", "Writerly", "Music-tuned", "Bookish"], summary: "You collect feelings like photographs. You'll find your aesthetic tribe." },
  { name: "The Grounded Helper", match: ["Community-driven", "First-Gen", "Earth-minded"], summary: "You lead with care. Others lean into your steadiness." },
  { name: "The Spirited Mixer", match: ["Lively", "Active", "Music-tuned"], summary: "You bring the warmth into a room. Your weeks fill up fast." },
];

function pickArchetype(tags: Set<string>): typeof ARCHETYPES[number] {
  let best = ARCHETYPES[0];
  let bestScore = -1;
  for (const a of ARCHETYPES) {
    const score = a.match.reduce((s, t) => s + (tags.has(t) ? 1 : 0), 0);
    if (score > bestScore) { best = a; bestScore = score; }
  }
  return best;
}

export interface AIProfileResult {
  personalityTags: string[];
  interests: string[];
  socialStyle: string;
  studentArchetype: string;
  onboardingSummary: string;
  matchSeed: string;
}

async function tryGemini(answers: OnboardingAnswer[]): Promise<AIProfileResult | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    // Dynamic import so the dep is optional.
    // @ts-ignore — optional dependency
    const mod = await import("@google/generative-ai").catch(() => null);
    if (!mod) return null;
    const { GoogleGenerativeAI } = mod;
    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });
    const prompt = `You are UniVibe's warm AI friend. Read these onboarding answers from a new university student and return JSON.

ANSWERS:
${answers.map((a, i) => `${i + 1}. Q: ${a.q}\n   A: ${a.a}`).join("\n")}

Return ONLY this JSON shape (no prose):
{
  "personalityTags": [3-6 short Gen-Z friendly traits, like "Quietly social" or "Builder"],
  "interests": [3-6 interest topics, like "Sustainability" or "Film"],
  "socialStyle": "one short sentence describing how they like to connect",
  "studentArchetype": "a short, warm, non-cringe archetype name like 'The Quiet Connector'",
  "onboardingSummary": "2-3 sentences in warm, peer-to-peer second person ('you') summarizing who they are and what they'll find here. Anti-corporate."
}`;
    const resp = await model.generateContent(prompt);
    const text = resp.response.text();
    const parsed = JSON.parse(text);
    return {
      personalityTags: parsed.personalityTags ?? [],
      interests: parsed.interests ?? [],
      socialStyle: parsed.socialStyle ?? "",
      studentArchetype: parsed.studentArchetype ?? "The Open-Hearted Explorer",
      onboardingSummary: parsed.onboardingSummary ?? "",
      matchSeed: hashSeed(JSON.stringify(answers)),
    };
  } catch (err) {
    console.warn("[ai] Gemini call failed, falling back:", err);
    return null;
  }
}

function deterministicProfile(answers: OnboardingAnswer[]): AIProfileResult {
  const combined = answers.map((a) => a.a).join(" \n ");
  const tags = new Set<string>();
  const interests = new Set<string>();
  for (const { kw, tag, interest } of TAG_MAP) {
    if (kw.test(combined)) {
      tags.add(tag);
      if (interest) interests.add(interest);
    }
  }
  // Default flavor so empty-ish answers still get a profile.
  if (tags.size === 0) {
    tags.add("Belonging-seeking");
    tags.add("Quietly social");
  }
  if (interests.size === 0) {
    interests.add("Quiet Hangouts");
    interests.add("Community & Activism");
  }
  const archetype = pickArchetype(tags);
  const firstWord = answers[answers.length - 1]?.a?.split(/\s+/)[0] ?? "open";

  const social = tags.has("Lively")
    ? "You connect through shared energy and IRL plans."
    : tags.has("Builder")
    ? "You connect through making things together."
    : tags.has("Quietly social")
    ? "You connect 1:1 or in small rooms, not loud crowds."
    : "You connect through real conversations and shared interests.";

  const summary =
    `${archetype.summary} Based on what you shared, you're drawn to ${[...interests].slice(0, 3).join(", ").toLowerCase()}. ` +
    `You want your first week to feel "${firstWord}" — UniVibe will keep that intention in your matched rooms.`;

  return {
    personalityTags: [...tags].slice(0, 6),
    interests: [...interests].slice(0, 6),
    socialStyle: social,
    studentArchetype: archetype.name,
    onboardingSummary: summary,
    matchSeed: hashSeed(combined),
  };
}

export async function generateProfile(answers: OnboardingAnswer[]): Promise<AIProfileResult> {
  const fromAI = await tryGemini(answers);
  return fromAI ?? deterministicProfile(answers);
}

// ----------------------------------------------------------------------------
// Group generation. Static catalog → score against profile.
// ----------------------------------------------------------------------------
interface RoomTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  signals: string[];          // tags/interests we look for
  roomType: "interest" | "cohort";
  baseMembers: number;
}

const ROOM_CATALOG: RoomTemplate[] = [
  {
    id: "sustainable-design-nerds",
    name: "Sustainable Design Nerds",
    description: "For people who'd happily talk about circular materials and Figma plugins in the same breath.",
    tags: ["sustainability", "design", "ideas"],
    signals: ["Earth-minded", "Creative", "Design", "Sustainability"],
    roomType: "interest",
    baseMembers: 47,
  },
  {
    id: "first-gen-uni-starters",
    name: "First-Gen Uni Starters",
    description: "A soft-landing room for first-in-family students — no question is too small.",
    tags: ["first-gen", "support", "real talk"],
    signals: ["First-Gen", "First-Gen Network", "Community-driven", "Brave-curious"],
    roomType: "cohort",
    baseMembers: 112,
  },
  {
    id: "quiet-study-circle",
    name: "Quiet Study Circle",
    description: "Library energy + co-working vibes. Pomodoros, playlists, and zero pressure.",
    tags: ["study", "focus", "low-key"],
    signals: ["Quietly social", "Focused", "Study Circles", "Bookish"],
    roomType: "interest",
    baseMembers: 73,
  },
  {
    id: "film-philosophy-crowd",
    name: "Film & Philosophy Crowd",
    description: "We watch the same movie, then argue about it kindly at 1am.",
    tags: ["film", "ideas", "late-night"],
    signals: ["Cinephile", "Bookish", "Writerly", "Film", "Books & Ideas"],
    roomType: "interest",
    baseMembers: 38,
  },
  {
    id: "builders-hackathon-people",
    name: "Builders & Hackathon People",
    description: "Side projects, ship-its, and \"want to build this with me?\" energy.",
    tags: ["build", "tech", "side-projects"],
    signals: ["Builder", "Creative", "Builders & Hackers"],
    roomType: "interest",
    baseMembers: 64,
  },
  {
    id: "monash-2026-design-cohort",
    name: "Monash 2026 Design Cohort",
    description: "Your starting class. Move-in tips, lecturer rumors, and Day-1 plans.",
    tags: ["cohort", "Monash", "2026"],
    signals: ["Creative", "Design", "Belonging-seeking", "Builder"],
    roomType: "cohort",
    baseMembers: 86,
  },
  {
    id: "music-makers-room",
    name: "Music Makers Room",
    description: "Bedroom producers, songwriters, jam-night people.",
    tags: ["music", "creative", "collab"],
    signals: ["Music-tuned", "Music", "Creative"],
    roomType: "interest",
    baseMembers: 52,
  },
  {
    id: "writers-room",
    name: "Writers' Room",
    description: "Journals, essays, half-finished novels. Soft feedback, real shipping.",
    tags: ["writing", "creative"],
    signals: ["Writerly", "Bookish"],
    roomType: "interest",
    baseMembers: 41,
  },
  {
    id: "outdoors-active-circle",
    name: "Outdoors & Active Circle",
    description: "Trail runs, climbing-gym crews, weekend hikes.",
    tags: ["active", "outdoors"],
    signals: ["Active", "Wanderer", "Active Life", "Travel & Outdoors"],
    roomType: "interest",
    baseMembers: 58,
  },
  {
    id: "open-hearted-newcomers",
    name: "Open-Hearted Newcomers",
    description: "Anyone showing up nervous, curious, hopeful. We start here.",
    tags: ["welcome", "warm", "real"],
    signals: ["Belonging-seeking", "Brave-curious"],
    roomType: "cohort",
    baseMembers: 204,
  },
];

function pickReason(signals: string[], hit: string[]): string {
  if (hit.length === 0) return "Matched on your overall vibe and openness.";
  const first = hit[0];
  if (first === "First-Gen") return "You mentioned being first in your family at uni — this room gets it.";
  if (first === "Builder" || first === "Builders & Hackers") return "Your maker streak fits the room's project energy.";
  if (first === "Quietly social") return "Low-key, no-pressure social — your speed.";
  if (first === "Creative" || first === "Design") return "Matched on your creative / design signals.";
  if (first === "Cinephile" || first === "Film") return "Matched on your film & ideas signals.";
  if (first === "Music-tuned" || first === "Music") return "Music came up in your answers — this is your room.";
  if (first === "Earth-minded" || first === "Sustainability") return "You light up about sustainability.";
  if (first === "Active") return "Movement showed up across your answers.";
  if (first === "Belonging-seeking") return "You want to feel seen before Day 1. So does everyone here.";
  return `Matched on: ${hit.slice(0, 2).join(", ")}.`;
}

export interface GeneratedRoom extends Omit<Room, "tags"> {
  tags: string[];
}

export function generateGroups(profile: AIProfileResult): GeneratedRoom[] {
  const signals = new Set<string>([...profile.personalityTags, ...profile.interests]);
  const seedNum = parseInt(profile.matchSeed, 36) || 1;
  const ranked = ROOM_CATALOG.map((tpl) => {
    const hit = tpl.signals.filter((s) => signals.has(s));
    const base = hit.length * 18 + 30;
    // Light deterministic jitter from seed
    const jitter = ((seedNum + tpl.id.charCodeAt(0)) % 9) - 4;
    const score = Math.max(40, Math.min(98, base + jitter + (tpl.roomType === "cohort" ? 6 : 0)));
    return { tpl, score, hit };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return ranked.map(({ tpl, score, hit }) => ({
    id: tpl.id,
    name: tpl.name,
    description: tpl.description,
    tags: tpl.tags,
    matchScore: score,
    matchReason: pickReason(tpl.signals, hit),
    memberCount: tpl.baseMembers + (seedNum % 13),
    roomType: tpl.roomType,
  }));
}

// ----------------------------------------------------------------------------
// Seed peer messages for a room, tinted by the user's profile.
// ----------------------------------------------------------------------------
interface SeedMessage {
  authorName: string;
  authorTag: string;
  body: string;
}

const PEER_LIBRARY: Record<string, SeedMessage[]> = {
  "sustainable-design-nerds": [
    { authorName: "Maya", authorTag: "Material nerd", body: "anyone read that Bret Victor piece on tools again? been rotating it in my brain." },
    { authorName: "Theo", authorTag: "Circular design", body: "looking for collab on a packaging redesign brief — DM me if you'd jump on a call." },
    { authorName: "Priya", authorTag: "Plant friend", body: "currently propagating monsteras while ignoring my readings 🌱" },
  ],
  "first-gen-uni-starters": [
    { authorName: "Jules", authorTag: "First-gen", body: "no one in my family has ever done this. low-key terrified but here we go." },
    { authorName: "Amal", authorTag: "Soft landing", body: "wait can someone explain what \"tutorials\" actually are vs lectures lol" },
    { authorName: "Sasha", authorTag: "Real-talk", body: "scholarship admin is a maze. happy to share the spreadsheet i made." },
  ],
  "quiet-study-circle": [
    { authorName: "Ren", authorTag: "Library kid", body: "starting a 25-min pomodoro at the hour — drop a 🍅 if you're in." },
    { authorName: "Liu", authorTag: "Focus mode", body: "lo-fi or classical for chem revision? need a vibe check." },
    { authorName: "Noor", authorTag: "Co-working", body: "found a window seat on level 4 that gets the late afternoon sun. highly recommended." },
  ],
  "film-philosophy-crowd": [
    { authorName: "Iris", authorTag: "Cinephile", body: "wong kar-wai marathon this saturday, my place, BYO snacks and feelings." },
    { authorName: "Mateo", authorTag: "Late-night talker", body: "is 'After Hours' (2024) a movie about loneliness or about hope? i need to argue this." },
    { authorName: "Quinn", authorTag: "Writerly", body: "just finished Camus and now everything feels heavier and lighter at once." },
  ],
  "builders-hackathon-people": [
    { authorName: "Devi", authorTag: "Maker", body: "weekend hack idea: a tiny app that tells you when the campus cafe queue is short. who's in?" },
    { authorName: "Kai", authorTag: "Frontend curious", body: "just learned about CSS subgrid and i can't stop thinking about it." },
    { authorName: "Sora", authorTag: "Hardware", body: "soldering meetup might happen if we get 4+ people. RSVP with a 🔧" },
  ],
  "monash-2026-design-cohort": [
    { authorName: "Aria", authorTag: "Same cohort", body: "anyone else doing first-year design? scared of the foundation studio brief honestly." },
    { authorName: "Ben", authorTag: "Monash 2026", body: "found a 6-person sharehouse in Clayton if anyone is still looking 🏠" },
    { authorName: "Hana", authorTag: "Cohort buddy", body: "i'm flying in from singapore — would love to meet someone before O-week!" },
  ],
  "music-makers-room": [
    { authorName: "Ezra", authorTag: "Producer", body: "rough demo here — would love ears on the second drop https://demo.local/rough" },
    { authorName: "Mei", authorTag: "Songwriter", body: "lyric-share saturday? bring something half-finished, no judgment." },
    { authorName: "Tom", authorTag: "Open-mic regular", body: "open-mic at The Den every wed — squad goes most weeks." },
  ],
  "writers-room": [
    { authorName: "Rumi", authorTag: "Essayist", body: "writing about the loneliness of moving cities. anyone want to swap drafts?" },
    { authorName: "Zara", authorTag: "Poetry", body: "wrote three terrible haikus on the bus and i feel oddly proud." },
    { authorName: "Lev", authorTag: "Novel-in-progress", body: "deeply stuck at chapter 3 forever. solidarity?" },
  ],
  "outdoors-active-circle": [
    { authorName: "Tess", authorTag: "Trail runner", body: "sunrise run sat 6am, easy pace, all levels welcome ☀️" },
    { authorName: "Arjun", authorTag: "Climber", body: "indoor bouldering tonight, group of 5 going, free shoes for newbies." },
    { authorName: "Pip", authorTag: "Weekend hiker", body: "looking for a hike buddy for the dandenongs — i'm slow but enthusiastic." },
  ],
  "open-hearted-newcomers": [
    { authorName: "Ada", authorTag: "Newcomer", body: "honestly just here to read other people's intros and feel less alone 🙃" },
    { authorName: "Sam", authorTag: "First week", body: "anyone else moving cities for this? trying not to spiral about packing." },
    { authorName: "Nia", authorTag: "Open-hearted", body: "if you want a coffee buddy in week 1, reply here — i'll keep a list." },
  ],
};

export function seedMessagesForRoom(roomId: string, profile: AIProfileResult): Array<SeedMessage & { isSystem?: boolean }> {
  const peer = PEER_LIBRARY[roomId] ?? PEER_LIBRARY["open-hearted-newcomers"];
  const welcome: SeedMessage & { isSystem: true } = {
    authorName: "UniVibe",
    authorTag: "Room host",
    isSystem: true,
    body: `Welcome in — you're matched here because of your ${profile.studentArchetype} vibe. Say hi however feels natural. Nobody here expects a polished intro.`,
  };
  return [welcome, ...peer];
}
