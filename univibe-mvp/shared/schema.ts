import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ----------------------------------------------------------------------------
// Users — demo auth only.
// NOTE: When swapping to Supabase Auth, replace the password column with a
// supabase user_id (foreign key to auth.users) and drop password handling.
// The rest of the schema (profiles, rooms, messages) remains identical.
// ----------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),    // demo only; Supabase Auth replaces this
  displayName: text("display_name").notNull(),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  isDemo: true,
});

// ----------------------------------------------------------------------------
// Profile — the result of AI onboarding. JSON columns store list fields
// (SQLite lacks native array support).
// ----------------------------------------------------------------------------
export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  answers: text("answers").notNull(),              // JSON: array of { q, a }
  personalityTags: text("personality_tags").notNull(), // JSON: string[]
  interests: text("interests").notNull(),          // JSON: string[]
  socialStyle: text("social_style").notNull(),
  studentArchetype: text("student_archetype").notNull(),
  onboardingSummary: text("onboarding_summary").notNull(),
  matchSeed: text("match_seed").notNull(),         // deterministic seed for matching
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });

// ----------------------------------------------------------------------------
// Rooms — recommended groups, possibly joined by user. Membership is implicit
// via the "members" join table.
// ----------------------------------------------------------------------------
export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  tags: text("tags").notNull(),                    // JSON: string[]
  matchScore: integer("match_score").notNull(),
  matchReason: text("match_reason").notNull(),
  memberCount: integer("member_count").notNull(),
  roomType: text("room_type").notNull(),           // "interest" | "cohort"
});

export const insertRoomSchema = createInsertSchema(rooms);

export const roomMembers = sqliteTable("room_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: text("room_id").notNull().references(() => rooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
});

// ----------------------------------------------------------------------------
// Messages — chat in a room.
// NOTE: When swapping to Supabase Realtime, mirror this schema in Postgres and
// subscribe to inserts. The frontend's polling React-Query usage maps cleanly
// to a Realtime channel.
// ----------------------------------------------------------------------------
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: text("room_id").notNull().references(() => rooms.id),
  authorName: text("author_name").notNull(),
  authorTag: text("author_tag").notNull(),         // short personality hint
  isUser: integer("is_user", { mode: "boolean" }).notNull().default(false),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),      // unix ms
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });

// ----------------------------------------------------------------------------
// Career runs — persists the generated paths so users can revisit without
// re-prompting. Easily Supabase-portable; no client storage needed.
// ----------------------------------------------------------------------------
export const careerRuns = sqliteTable("career_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  degree: text("degree").notNull(),
  values: text("values").notNull(),  // JSON: string[]
  result: text("result").notNull(),  // JSON: CareerResult
  createdAt: integer("created_at").notNull(),
});

// ----------------------------------------------------------------------------
// Micro-skill completions — tiny completion log. Used to render "completed"
// state across sessions without any browser storage.
// ----------------------------------------------------------------------------
export const microSkillCompletions = sqliteTable("micro_skill_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  topic: text("topic").notNull(),
  completedAt: integer("completed_at").notNull(),
});

// ----------------------------------------------------------------------------
// Onboarding answer payload (used over the wire)
// ----------------------------------------------------------------------------
export const onboardingAnswerSchema = z.object({
  q: z.string(),
  a: z.string().min(1).max(500),
});
export const onboardingPayloadSchema = z.object({
  userId: z.number(),
  answers: z.array(onboardingAnswerSchema).min(3).max(10),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

export type Room = typeof rooms.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type OnboardingAnswer = z.infer<typeof onboardingAnswerSchema>;
export type OnboardingPayload = z.infer<typeof onboardingPayloadSchema>;

// Hydrated types for API responses (JSON columns parsed).
export type HydratedProfile = Omit<Profile, "answers" | "personalityTags" | "interests"> & {
  answers: OnboardingAnswer[];
  personalityTags: string[];
  interests: string[];
};

export type HydratedRoom = Omit<Room, "tags"> & {
  tags: string[];
  joined?: boolean;
};

export type CareerRun = typeof careerRuns.$inferSelect;
export type MicroSkillCompletion = typeof microSkillCompletions.$inferSelect;
