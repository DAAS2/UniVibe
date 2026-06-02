// ----------------------------------------------------------------------------
// UniVibe — Campus Vibe module.
//
// Monash-only for MVP. The university catalog below is intentionally a plain
// data structure so it's trivial to add UNSW, Melbourne, RMIT, etc. later —
// the API + frontend already key on `universityId`.
//
// Provides:
//   - getUniversity(id)
//   - generateCampusNarrative(profile, uni)  → "A Day In Your Life" text
//   - rankClubsAndEvents(profile, uni)       → personalised lists
//
// Like ai.ts, narrative generation tries Gemini first if GEMINI_API_KEY is
// present; otherwise falls back to a deterministic warm narrative built from
// the user's interests + Monash facts. No browser memory required.
// ----------------------------------------------------------------------------

import type { HydratedProfile } from "@shared/schema";

export interface CampusClub {
  id: string;
  name: string;
  blurb: string;
  signals: string[]; // tags/interests we match against
  meetCadence: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  when: string;
  where: string;
  blurb: string;
  signals: string[];
}

export interface StudentStory {
  id: string;
  name: string;
  course: string;
  year: string;
  quote: string;
  tag: string; // short personality hint
}

export interface CampusMapPin {
  id: string;
  label: string;
  emoji: string;
  vibe: string;        // 1-line cultural snapshot
  bestFor: string[];   // archetypes / vibes that fit
}

export interface University {
  id: string;
  name: string;
  shortName: string;
  city: string;
  tagline: string;
  cultureSnapshot: string;
  weeklyRhythm: string[];   // 3-4 cultural beats e.g. "Wednesday market on the lawn"
  iconicSpots: string[];    // for narrative texture
  mapPins: CampusMapPin[];
  clubs: CampusClub[];
  events: CampusEvent[];
  stories: StudentStory[];
}

// ----------------------------------------------------------------------------
// MONASH — the only seeded university for MVP. Facts are intentionally
// non-controversial cultural texture, not numerical claims.
// ----------------------------------------------------------------------------
const MONASH: University = {
  id: "monash",
  name: "Monash University",
  shortName: "Monash",
  city: "Melbourne, Australia",
  tagline: "Big enough to find your people, friendly enough to be found.",
  cultureSnapshot:
    "Monash feels like a small city of students. Clayton's campus has the lawns and the lecture-after-lecture rhythm; Caulfield leans creative and design-heavy; the Wholefoods Co-op and the Sir Louis Matheson Library are the unofficial heart of student life. Expect warm Melbourne autumns, cold-but-bright winters, and a culture that genuinely respects quiet people.",
  weeklyRhythm: [
    "Wednesday Wholefoods lunch on the Clayton lawn",
    "Thursday MSA-run live music at Sir John's Bar",
    "Friday film nights with the Film Society",
    "Sunday study marathons in Matheson Library",
  ],
  iconicSpots: [
    "Sir Louis Matheson Library",
    "Campus Centre",
    "Lemon-Scented Lawn",
    "Caulfield Green",
    "MADA studios",
    "Robert Blackwood Hall",
    "Wholefoods Co-op",
  ],
  mapPins: [
    {
      id: "matheson",
      label: "Matheson Library",
      emoji: "📚",
      vibe: "The mothership. Silent floors upstairs, friendly chatter on level 1.",
      bestFor: ["Quietly social", "Focused", "Bookish"],
    },
    {
      id: "lemon-lawn",
      label: "Lemon-Scented Lawn",
      emoji: "🌿",
      vibe: "Sunny picnics, club sign-ups, frisbee, the occasional protest.",
      bestFor: ["Community-driven", "Belonging-seeking", "Lively"],
    },
    {
      id: "wholefoods",
      label: "Wholefoods Co-op",
      emoji: "🥦",
      vibe: "Vegetarian, volunteer-run, and accidentally the friendliest room on campus.",
      bestFor: ["Earth-minded", "Community-driven", "Quietly social"],
    },
    {
      id: "mada",
      label: "MADA Studios",
      emoji: "🎨",
      vibe: "Caulfield's design heartbeat — late-night studios, paint fumes, soft critique.",
      bestFor: ["Creative", "Builder", "Writerly"],
    },
    {
      id: "sir-johns",
      label: "Sir John's Bar",
      emoji: "🎶",
      vibe: "Live student bands Thursdays. Cheap pots, kind crowd.",
      bestFor: ["Music-tuned", "Lively", "Spirited Mixer"],
    },
    {
      id: "campus-centre",
      label: "Campus Centre",
      emoji: "🏛️",
      vibe: "Where you accidentally meet everyone. Stalls, food, second-hand book swaps.",
      bestFor: ["Open-Hearted Explorer", "Belonging-seeking"],
    },
  ],
  clubs: [
    {
      id: "msa-film",
      name: "Monash Film Society (MUFS)",
      blurb: "Weekly screenings + post-film debrief in the union basement. Soft critics only.",
      signals: ["Cinephile", "Bookish", "Writerly", "Film", "Books & Ideas"],
      meetCadence: "Wednesdays 7pm",
    },
    {
      id: "msa-sustain",
      name: "Monash Sustainability Society",
      blurb: "Climate book clubs, op-shop crawls, on-campus plant swaps.",
      signals: ["Earth-minded", "Sustainability", "Community-driven"],
      meetCadence: "Tuesdays 5pm",
    },
    {
      id: "msa-makers",
      name: "Monash Makers Club",
      blurb: "Build nights, mini-hackathons, soldering 101 evenings.",
      signals: ["Builder", "Builders & Hackers", "Creative", "Design"],
      meetCadence: "Fridays 6pm",
    },
    {
      id: "msa-firstgen",
      name: "First-In-Family Network",
      blurb: "Peer mentors, scholarship-admin help, real-talk Sunday brunches.",
      signals: ["First-Gen", "First-Gen Network", "Brave-curious", "Belonging-seeking"],
      meetCadence: "Sundays 11am",
    },
    {
      id: "msa-write",
      name: "Lot's Wife Magazine",
      blurb: "Monash's 60-year-old student magazine. Pitch, edit, design, repeat.",
      signals: ["Writerly", "Bookish", "Creative"],
      meetCadence: "Mondays 6pm",
    },
    {
      id: "msa-music",
      name: "Monash Music Makers",
      blurb: "Bedroom producers and acoustic kids share works-in-progress at Sir John's.",
      signals: ["Music-tuned", "Music", "Creative"],
      meetCadence: "Thursdays 8pm",
    },
    {
      id: "msa-outdoors",
      name: "Monash Outdoors Club",
      blurb: "Dandenongs day hikes, Sat sunrise runs, occasional camping trips.",
      signals: ["Active", "Wanderer", "Active Life", "Travel & Outdoors"],
      meetCadence: "Saturday mornings",
    },
    {
      id: "msa-quiet",
      name: "Quiet Study Society",
      blurb: "Pomodoros and lo-fi in level 3 of Matheson. No small talk, no pressure.",
      signals: ["Quietly social", "Focused", "Study Circles", "Bookish"],
      meetCadence: "Daily, drop-in",
    },
  ],
  events: [
    {
      id: "ev-orientation-picnic",
      title: "O-Week Picnic on the Lemon-Scented Lawn",
      when: "Week 0 · Wednesday 12pm",
      where: "Lemon-Scented Lawn, Clayton",
      blurb: "Free food, club sign-ups, soft-launch friendship attempts.",
      signals: ["Belonging-seeking", "Community-driven", "Open-Hearted Explorer", "Lively"],
    },
    {
      id: "ev-makers-jam",
      title: "Monash Makers Weekend Jam",
      when: "Week 2 · Saturday 10am-6pm",
      where: "Engineering building, Clayton",
      blurb: "Tiny weekend hackathon. Bring an idea or just snacks.",
      signals: ["Builder", "Creative", "Builders & Hackers"],
    },
    {
      id: "ev-film-night",
      title: "MUFS: Wong Kar-wai Double Feature",
      when: "Week 3 · Wednesday 7pm",
      where: "Campus Centre, Theatre",
      blurb: "Two films, one debrief. Soft seats, soft opinions.",
      signals: ["Cinephile", "Bookish", "Writerly"],
    },
    {
      id: "ev-sustain-swap",
      title: "Wholefoods Plant + Book Swap",
      when: "Week 2 · Friday 1pm",
      where: "Wholefoods Co-op",
      blurb: "Bring a cutting, take a cutting. Bring a book, take a book.",
      signals: ["Earth-minded", "Sustainability", "Bookish"],
    },
    {
      id: "ev-quiet-study",
      title: "Library Pomodoro Marathon",
      when: "Week 4 · Sunday 10am-4pm",
      where: "Matheson Library, Level 3",
      blurb: "25-min focus, 5-min stretch, repeat. Snacks shared at 2pm.",
      signals: ["Quietly social", "Focused", "Study Circles"],
    },
    {
      id: "ev-music-open-mic",
      title: "Open Mic at Sir John's",
      when: "Week 3 · Thursday 8pm",
      where: "Sir John's Bar",
      blurb: "Half-written songs welcome. The crowd is kind on purpose.",
      signals: ["Music-tuned", "Music", "Lively"],
    },
    {
      id: "ev-firstgen-brunch",
      title: "First-In-Family Sunday Brunch",
      when: "Week 1 · Sunday 11am",
      where: "Campus Centre Café",
      blurb: "Older students, same nerves once. Bring questions, leave with people.",
      signals: ["First-Gen", "Brave-curious", "Belonging-seeking"],
    },
    {
      id: "ev-trail-run",
      title: "Sunrise Trail Run · Dandenongs",
      when: "Week 2 · Saturday 6am",
      where: "Meet at Clayton bus loop",
      blurb: "Easy pace, all levels, coffee after.",
      signals: ["Active", "Wanderer", "Active Life"],
    },
  ],
  stories: [
    {
      id: "story-1",
      name: "Priya",
      course: "Industrial Design",
      year: "Second-year",
      tag: "Quietly social",
      quote:
        "I came to Monash thinking I had to perform extrovert. Turns out the Wholefoods Co-op and Matheson Level 3 are full of people just like me. Different kind of friends — slower to start, longer to last.",
    },
    {
      id: "story-2",
      name: "Theo",
      course: "Software Engineering",
      year: "Third-year",
      tag: "Builder",
      quote:
        "Makers Club saved my first semester. I walked in not knowing anyone and walked out with two project partners and a Sunday side-project ritual.",
    },
    {
      id: "story-3",
      name: "Amal",
      course: "Arts (First-in-family)",
      year: "First-year",
      tag: "First-Gen",
      quote:
        "Nobody in my family had been to uni. The first-in-family Sunday brunch made me feel like the maze had a map and someone was walking it with me.",
    },
    {
      id: "story-4",
      name: "Hana",
      course: "Communications Design (MADA)",
      year: "Second-year",
      tag: "Creative Romantic",
      quote:
        "Caulfield in autumn looks like a film I'd want to direct. I write more here than I have in years.",
    },
    {
      id: "story-5",
      name: "Jules",
      course: "Environmental Science",
      year: "Third-year",
      tag: "Earth-minded",
      quote:
        "The Sustainability Society became my chosen family. Op-shop Sundays, plant swaps, climate book club — Monash actually backs up the talk.",
    },
  ],
};

const UNIVERSITIES: Record<string, University> = { monash: MONASH };

export function getUniversity(id: string): University | undefined {
  return UNIVERSITIES[id] ?? UNIVERSITIES["monash"];
}

export function listUniversities(): Array<Pick<University, "id" | "name" | "shortName" | "city">> {
  return Object.values(UNIVERSITIES).map((u) => ({
    id: u.id,
    name: u.name,
    shortName: u.shortName,
    city: u.city,
  }));
}

// ----------------------------------------------------------------------------
// Ranking helpers — score clubs and events against the user's signal set.
// ----------------------------------------------------------------------------
function scoreAgainstSignals(itemSignals: string[], userSignals: Set<string>): number {
  let score = 0;
  for (const sig of itemSignals) {
    if (userSignals.has(sig)) score += 1;
  }
  return score;
}

export function rankClubsAndEvents(
  profile: HydratedProfile | Pick<HydratedProfile, "personalityTags" | "interests" | "studentArchetype">,
  uni: University,
) {
  const signals = new Set<string>([
    ...(profile.personalityTags ?? []),
    ...(profile.interests ?? []),
    profile.studentArchetype ?? "",
  ]);

  const rankedClubs = uni.clubs
    .map((c) => ({ ...c, _score: scoreAgainstSignals(c.signals, signals) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 5)
    .map(({ _score, ...c }) => c);

  const rankedEvents = uni.events
    .map((e) => ({ ...e, _score: scoreAgainstSignals(e.signals, signals) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 5)
    .map(({ _score, ...e }) => e);

  const rankedPins = uni.mapPins
    .map((p) => ({ ...p, _score: scoreAgainstSignals(p.bestFor, signals) }))
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...p }) => p);

  return { clubs: rankedClubs, events: rankedEvents, mapPins: rankedPins };
}

// ----------------------------------------------------------------------------
// "A Day In Your Life at Monash" — narrative generator.
// Tries Gemini first if available; otherwise builds a warm deterministic
// narrative from the user's signals + Monash spots.
// ----------------------------------------------------------------------------
async function tryGeminiNarrative(
  profile: HydratedProfile,
  uni: University,
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    // @ts-ignore — optional dependency
    const mod = await import("@google/generative-ai").catch(() => null);
    if (!mod) return null;
    const { GoogleGenerativeAI } = mod;
    const client = new GoogleGenerativeAI(key);
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are UniVibe's warm AI friend writing a 4-paragraph "A Day In Your Life at ${uni.shortName}" narrative for a new student.

STUDENT PROFILE:
- Archetype: ${profile.studentArchetype}
- Personality: ${profile.personalityTags.join(", ")}
- Interests: ${profile.interests.join(", ")}
- Social style: ${profile.socialStyle}

UNIVERSITY FACTS (do not invent others, weave these in naturally):
- Campus culture: ${uni.cultureSnapshot}
- Iconic spots: ${uni.iconicSpots.join(", ")}
- Weekly rhythm beats: ${uni.weeklyRhythm.join("; ")}

Voice: warm, peer-to-peer, second person ("you"), grounded, anti-corporate. No emojis, no hype. 4 short paragraphs covering morning, midday, afternoon, evening — each anchored to a specific real spot from the iconic spots list. Each paragraph 2-3 sentences.

Return plain prose only.`;
    const resp = await model.generateContent(prompt);
    const text = resp.response.text().trim();
    return text || null;
  } catch (err) {
    console.warn("[campus] Gemini narrative failed, falling back:", err);
    return null;
  }
}

function pickSpot(uni: University, preferIds: string[]): CampusMapPin {
  for (const id of preferIds) {
    const found = uni.mapPins.find((p) => p.id === id);
    if (found) return found;
  }
  return uni.mapPins[0];
}

function deterministicNarrative(profile: HydratedProfile, uni: University): string {
  const tags = new Set(profile.personalityTags);

  const morningSpot =
    tags.has("Focused") || tags.has("Bookish") || tags.has("Quietly social")
      ? pickSpot(uni, ["matheson", "campus-centre"])
      : pickSpot(uni, ["lemon-lawn", "campus-centre"]);

  const middaySpot =
    tags.has("Earth-minded") || tags.has("Community-driven")
      ? pickSpot(uni, ["wholefoods", "campus-centre"])
      : pickSpot(uni, ["campus-centre", "lemon-lawn"]);

  const afternoonSpot =
    tags.has("Creative") || tags.has("Builder")
      ? pickSpot(uni, ["mada", "matheson"])
      : tags.has("Active")
      ? pickSpot(uni, ["lemon-lawn", "campus-centre"])
      : pickSpot(uni, ["matheson", "lemon-lawn"]);

  const eveningSpot =
    tags.has("Lively") || tags.has("Music-tuned")
      ? pickSpot(uni, ["sir-johns", "campus-centre"])
      : tags.has("Cinephile") || tags.has("Writerly")
      ? pickSpot(uni, ["campus-centre", "mada"])
      : pickSpot(uni, ["matheson", "campus-centre"]);

  const archetype = profile.studentArchetype.replace(/^The\s+/, "").toLowerCase();
  const firstInterest = profile.interests[0]?.toLowerCase() ?? "the things you care about";

  return [
    `Morning at ${uni.shortName}. You start the day at the ${morningSpot.label} — ${morningSpot.vibe.toLowerCase()} It's the kind of slow opening that suits a ${archetype}: warm coffee, a notebook open, no pressure to perform.`,
    `By lunchtime you drift toward the ${middaySpot.label}. ${middaySpot.vibe} You bump into someone from your matched room, talk for 20 minutes about ${firstInterest}, and forget to check your phone.`,
    `Afternoon belongs to the ${afternoonSpot.label}. ${afternoonSpot.vibe} You make something small — a sketch, a draft, a half-idea — and it's enough.`,
    `Evening pulls you toward the ${eveningSpot.label}. ${eveningSpot.vibe} You stay until it's dark, walk home along the Clayton paths, and realise the day didn't feel like work or like trying — just like being here.`,
  ].join("\n\n");
}

export async function generateCampusNarrative(
  profile: HydratedProfile,
  uni: University,
): Promise<{ narrative: string; source: "gemini" | "fallback" }> {
  const fromAI = await tryGeminiNarrative(profile, uni);
  if (fromAI) return { narrative: fromAI, source: "gemini" };
  return { narrative: deterministicNarrative(profile, uni), source: "fallback" };
}
