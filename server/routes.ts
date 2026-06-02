import type { Express, Request, Response } from "express";
import type { Server } from "node:http";
import { z } from "zod";
import { storage } from "./storage";
import { generateProfile, generateGroups, seedMessagesForRoom } from "./ai";
import {
  getUniversity,
  listUniversities,
  rankClubsAndEvents,
  generateCampusNarrative,
} from "./campus";
import {
  careerPayloadSchema,
  generateCareerPaths,
  microSkillRequestSchema,
  generateMicroSkillLesson,
} from "./career";
import {
  insertUserSchema,
  onboardingPayloadSchema,
  type HydratedProfile,
} from "@shared/schema";

// ----------------------------------------------------------------------------
// Routes — all under /api.
// Auth: demo-only. The user id is returned to the client and passed back on
// subsequent calls. When swapping to Supabase Auth, replace the signup/login
// handlers with a thin Supabase wrapper and read the user id from the verified
// JWT instead of the request body.
// ----------------------------------------------------------------------------

const signupSchema = insertUserSchema.extend({
  username: z.string().min(2).max(40),
  password: z.string().min(4).max(120),
  displayName: z.string().min(1).max(60),
});
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ---- AUTH ---------------------------------------------------------------
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const existing = await storage.getUserByUsername(parsed.data.username);
    if (existing) return res.status(409).json({ message: "Username already taken." });
    const user = await storage.createUser({ ...parsed.data, isDemo: false });
    return res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, isDemo: user.isDemo } });
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const user = await storage.getUserByUsername(parsed.data.username);
    if (!user || user.password !== parsed.data.password) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    return res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, isDemo: user.isDemo } });
  });

  app.post("/api/auth/demo", async (req: Request, res: Response) => {
    // Continue as demo student — creates a throwaway demo user. The frontend
    // tracks the returned id only in React state (no browser storage).
    const handle = "demo_" + Math.random().toString(36).slice(2, 8);
    const displayName = (req.body?.displayName || "Demo Student").toString().slice(0, 60);
    const user = await storage.createUser({
      username: handle,
      password: "demo-" + Math.random().toString(36).slice(2, 10),
      displayName,
      isDemo: true,
    });
    return res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, isDemo: user.isDemo } });
  });

  // ---- PROFILE / ONBOARDING ----------------------------------------------
  app.get("/api/profile/:userId", async (req: Request, res: Response) => {
    const userId = parseInt(String(req.params.userId), 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Bad userId" });
    const profile = await storage.getProfileByUser(userId);
    if (!profile) return res.status(404).json({ message: "No profile yet" });
    res.json(profile);
  });

  app.post("/api/onboarding/complete", async (req: Request, res: Response) => {
    const parsed = onboardingPayloadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const { userId, answers } = parsed.data;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ai = await generateProfile(answers);
    const profile = await storage.upsertProfile({
      userId,
      answers: JSON.stringify(answers),
      personalityTags: JSON.stringify(ai.personalityTags),
      interests: JSON.stringify(ai.interests),
      socialStyle: ai.socialStyle,
      studentArchetype: ai.studentArchetype,
      onboardingSummary: ai.onboardingSummary,
      matchSeed: ai.matchSeed,
    });

    // Generate and persist groups + seed messages so the chat is alive.
    const groups = generateGroups(ai);
    for (const g of groups) {
      const room = await storage.upsertRoom({
        id: g.id,
        name: g.name,
        description: g.description,
        tags: JSON.stringify(g.tags),
        matchScore: g.matchScore,
        matchReason: g.matchReason,
        memberCount: g.memberCount,
        roomType: g.roomType,
      });
      // Only seed messages once per room (idempotent).
      const existing = await storage.listMessages(room.id);
      if (existing.length === 0) {
        const seeds = seedMessagesForRoom(room.id, ai);
        const t0 = Date.now() - seeds.length * 60_000;
        for (let i = 0; i < seeds.length; i++) {
          const s = seeds[i];
          await storage.addMessage({
            roomId: room.id,
            authorName: s.authorName,
            authorTag: s.authorTag,
            isUser: false,
            isSystem: !!s.isSystem,
            body: s.body,
            createdAt: t0 + i * 60_000,
          });
        }
      }
    }

    res.json({ profile, groups });
  });

  // ---- GROUPS / ROOMS -----------------------------------------------------
  app.get("/api/groups/:userId", async (req: Request, res: Response) => {
    const userId = parseInt(String(req.params.userId), 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Bad userId" });
    const profile = await storage.getProfileByUser(userId);
    if (!profile) return res.status(404).json({ message: "Complete onboarding first." });
    const groups = generateGroups({
      personalityTags: profile.personalityTags,
      interests: profile.interests,
      socialStyle: profile.socialStyle,
      studentArchetype: profile.studentArchetype,
      onboardingSummary: profile.onboardingSummary,
      matchSeed: profile.matchSeed,
    });
    const joined = await storage.listUserRooms(userId);
    const joinedIds = new Set(joined.map((r) => r.id));
    res.json(groups.map((g) => ({ ...g, joined: joinedIds.has(g.id) })));
  });

  app.post("/api/rooms/:roomId/join", async (req: Request, res: Response) => {
    const userId = parseInt(String(req.body?.userId ?? ""), 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Bad userId" });
    await storage.joinRoom(String(req.params.roomId), userId);
    const room = await storage.getRoom(String(req.params.roomId));
    res.json({ room: { ...room, joined: true } });
  });

  app.get("/api/rooms/:roomId", async (req: Request, res: Response) => {
    const room = await storage.getRoom(String(req.params.roomId));
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  // ---- CHAT ---------------------------------------------------------------
  // NOTE: Polling is fine for the MVP. To swap in Supabase Realtime, replace
  // the GET below with a subscribe-to-channel on the client and let the server
  // simply persist inserts.
  app.get("/api/rooms/:roomId/messages", async (req: Request, res: Response) => {
    const list = await storage.listMessages(String(req.params.roomId));
    res.json(list);
  });

  const sendMsgSchema = z.object({
    userId: z.number(),
    body: z.string().min(1).max(800),
  });
  app.post("/api/rooms/:roomId/messages", async (req: Request, res: Response) => {
    const parsed = sendMsgSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const user = await storage.getUser(parsed.data.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const room = await storage.getRoom(String(req.params.roomId));
    if (!room) return res.status(404).json({ message: "Room not found" });

    const profile = await storage.getProfileByUser(user.id);
    const tag = profile?.studentArchetype?.replace(/^The\s+/, "") ?? "Newcomer";

    const msg = await storage.addMessage({
      roomId: room.id,
      authorName: user.displayName,
      authorTag: tag,
      isUser: true,
      isSystem: false,
      body: parsed.data.body,
      createdAt: Date.now(),
    });
    res.json(msg);
  });

  // ---- CAMPUS VIBE --------------------------------------------------------
  // Monash-only for MVP. The data structure is multi-university-ready: pass
  // ?university=monash (default) on each call. Future: swap the in-memory
  // catalog for a Postgres/Supabase table without changing the API shape.
  app.get("/api/campus/universities", (_req, res) => {
    res.json(listUniversities());
  });

  app.get("/api/campus/:userId", async (req: Request, res: Response) => {
    const userId = parseInt(String(req.params.userId), 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Bad userId" });
    const uniId = String(req.query.university ?? "monash");
    const uni = getUniversity(uniId);
    if (!uni) return res.status(404).json({ message: "Unknown university" });

    const profile = await storage.getProfileByUser(userId);
    if (!profile) return res.status(404).json({ message: "Complete onboarding first." });

    const ranked = rankClubsAndEvents(profile, uni);
    const { narrative, source } = await generateCampusNarrative(profile, uni);

    res.json({
      university: {
        id: uni.id,
        name: uni.name,
        shortName: uni.shortName,
        city: uni.city,
        tagline: uni.tagline,
        cultureSnapshot: uni.cultureSnapshot,
        weeklyRhythm: uni.weeklyRhythm,
      },
      mapPins: ranked.mapPins,
      clubs: ranked.clubs,
      events: ranked.events,
      stories: uni.stories,
      narrative,
      narrativeSource: source,
      profile: {
        studentArchetype: profile.studentArchetype,
        personalityTags: profile.personalityTags,
        interests: profile.interests,
      },
    });
  });

  // ---- CAREER PATHWAY -----------------------------------------------------
  app.post("/api/career/generate", async (req: Request, res: Response) => {
    const userIdRaw = req.body?.userId;
    const userId = typeof userIdRaw === "number" ? userIdRaw : parseInt(String(userIdRaw ?? ""), 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Bad userId" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const parsed = careerPayloadSchema.safeParse({
      degree: req.body?.degree,
      values: req.body?.values,
    });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const result = await generateCareerPaths(parsed.data);
    await storage.saveCareerRun(userId, parsed.data.degree, parsed.data.values, result);
    res.json(result);
  });

  app.get("/api/career/:userId/latest", async (req: Request, res: Response) => {
    const userId = parseInt(String(req.params.userId), 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Bad userId" });
    const run = await storage.getLatestCareerRun(userId);
    if (!run) return res.status(404).json({ message: "No career run yet" });
    res.json({
      degree: run.degree,
      values: JSON.parse(run.values),
      result: JSON.parse(run.result),
      createdAt: run.createdAt,
    });
  });

  // ---- MICRO-SKILL --------------------------------------------------------
  app.post("/api/microskill/generate", async (req: Request, res: Response) => {
    const parsed = microSkillRequestSchema.safeParse({
      topic: req.body?.topic,
      degree: req.body?.degree,
    });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const lesson = await generateMicroSkillLesson(parsed.data.topic, parsed.data.degree);
    res.json(lesson);
  });

  app.post("/api/microskill/complete", async (req: Request, res: Response) => {
    const userIdRaw = req.body?.userId;
    const userId = typeof userIdRaw === "number" ? userIdRaw : parseInt(String(userIdRaw ?? ""), 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Bad userId" });
    const topic = String(req.body?.topic ?? "").trim();
    if (!topic) return res.status(400).json({ message: "Missing topic" });
    const completion = await storage.markMicroSkillComplete(userId, topic);
    res.json(completion);
  });

  app.get("/api/microskill/:userId/completions", async (req: Request, res: Response) => {
    const userId = parseInt(String(req.params.userId), 10);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Bad userId" });
    const list = await storage.listMicroSkillCompletions(userId);
    res.json(list);
  });

  // ---- HEALTH -------------------------------------------------------------
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  return httpServer;
}
