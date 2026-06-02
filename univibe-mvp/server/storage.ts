import {
  users, profiles, rooms, roomMembers, messages,
  type User, type InsertUser, type Profile, type InsertProfile,
  type Room, type Message, type InsertMessage,
  type HydratedProfile, type HydratedRoom,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, asc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Ensure tables exist using separate clean executions
function ensureSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      answers TEXT NOT NULL,
      personality_tags TEXT NOT NULL,
      interests TEXT NOT NULL,
      social_style TEXT NOT NULL,
      student_archetype TEXT NOT NULL,
      onboarding_summary TEXT NOT NULL,
      match_seed TEXT NOT NULL
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      tags TEXT NOT NULL,
      match_score INTEGER NOT NULL,
      match_reason TEXT NOT NULL,
      member_count INTEGER NOT NULL,
      room_type TEXT NOT NULL
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS room_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id INTEGER NOT NULL
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_tag TEXT NOT NULL,
      is_user INTEGER NOT NULL DEFAULT 0,
      is_system INTEGER NOT NULL DEFAULT 0,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}
ensureSchema();

// Fixed: Maps database snake_case keys correctly to JavaScript/TypeScript targets
function hydrateProfile(p: any): HydratedProfile {
  return {
    ...p,
    answers: JSON.parse(p.answers),
    personalityTags: JSON.parse(p.personality_tags || p.personalityTags),
    interests: JSON.parse(p.interests),
  };
}

function hydrateRoom(r: any, joined = false): HydratedRoom {
  return { ...r, tags: JSON.parse(r.tags), joined };
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProfileByUser(userId: number): Promise<HydratedProfile | undefined>;
  upsertProfile(profile: InsertProfile): Promise<HydratedProfile>;

  upsertRoom(room: Room): Promise<HydratedRoom>;
  getRoom(roomId: string): Promise<HydratedRoom | undefined>;
  joinRoom(roomId: string, userId: number): Promise<void>;
  listUserRooms(userId: number): Promise<HydratedRoom[]>;

  addMessage(msg: InsertMessage): Promise<Message>;
  listMessages(roomId: string): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    return db.insert(users).values(insertUser).returning().get();
  }

  async getProfileByUser(userId: number): Promise<HydratedProfile | undefined> {
    // Fixed: maps back to schema camelCase or runtime query objects safely
    const row = db.select().from(profiles).where(eq(profiles.userId, userId)).get();
    return row ? hydrateProfile(row) : undefined;
  }
  async upsertProfile(profile: InsertProfile): Promise<HydratedProfile> {
    const existing = db.select().from(profiles).where(eq(profiles.userId, profile.userId)).get();
    if (existing) {
      const updated = db.update(profiles).set(profile).where(eq(profiles.id, existing.id)).returning().get();
      return hydrateProfile(updated);
    }
    const created = db.insert(profiles).values(profile).returning().get();
    return hydrateProfile(created);
  }

  async upsertRoom(room: Room): Promise<HydratedRoom> {
    const existing = db.select().from(rooms).where(eq(rooms.id, room.id)).get();
    if (existing) {
      const updated = db.update(rooms).set(room).where(eq(rooms.id, room.id)).returning().get();
      return hydrateRoom(updated);
    }
    const created = db.insert(rooms).values(room).returning().get();
    return hydrateRoom(created);
  }
  async getRoom(roomId: string): Promise<HydratedRoom | undefined> {
    const row = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    return row ? hydrateRoom(row) : undefined;
  }
  async joinRoom(roomId: string, userId: number): Promise<void> {
    const existing = db.select().from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId))).get();
    if (existing) return;
    db.insert(roomMembers).values({ roomId, userId }).run();
    
    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (room) {
      // Fixed: targets both mapped versions securely
      const currentCount = room.memberCount !== undefined ? room.memberCount : (room as any).member_count;
      db.update(rooms).set({ memberCount: currentCount + 1 }).where(eq(rooms.id, roomId)).run();
    }
  }
  async listUserRooms(userId: number): Promise<HydratedRoom[]> {
    const joined = db.select().from(roomMembers).where(eq(roomMembers.userId, userId)).all();
    const ids = new Set(joined.map((m) => m.roomId));
    const allRooms = db.select().from(rooms).all();
    return allRooms.filter((r) => ids.has(r.id)).map((r) => hydrateRoom(r, true));
  }

  async addMessage(msg: InsertMessage): Promise<Message> {
    return db.insert(messages).values(msg).returning().get();
  }
  async listMessages(roomId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.roomId, roomId)).orderBy(asc(messages.id)).all();
  }
}

export const storage = new DatabaseStorage();