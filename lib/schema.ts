import {
  pgTable,
  doublePrecision,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* Better Auth core tables (with admin-plugin fields). */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("resident"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userRelations = relations(user, ({ one }) => ({
  profile: one(profile, { fields: [user.id], references: [profile.userId] }),
}));

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* Resident directory. Listing is opt-in; any field left empty is
   simply not shared. Photo columns store private-blob pathnames served
   through the session-checked /api/photos route. Latitude/longitude
   are geocoded from the address when it is saved, for the map pin. */
export const profile = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  optIn: boolean("opt_in").notNull().default(false),
  unit: text("unit"),
  phone: text("phone"),
  bio: text("bio"),
  facts: text("facts"),
  photoKey: text("photo_key"),
  residencePhotoKey: text("residence_photo_key"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const profileRelations = relations(profile, ({ one, many }) => ({
  user: one(user, { fields: [profile.userId], references: [user.id] }),
  pets: many(pet),
}));

export const pet = pgTable("pet", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  species: text("species"),
  photoKey: text("photo_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const petRelations = relations(pet, ({ one }) => ({
  profile: one(profile, { fields: [pet.userId], references: [profile.userId] }),
}));

/* Community content. */

/* Forum threads on the community board. lastReplyAt drives "latest
   activity" ordering and is bumped by each reply. */
export const thread = pgTable("thread", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("visible"),
  hiddenById: text("hidden_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  hiddenAt: timestamp("hidden_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastReplyAt: timestamp("last_reply_at").notNull().defaultNow(),
});

export const threadRelations = relations(thread, ({ one }) => ({
  author: one(user, { fields: [thread.userId], references: [user.id] }),
}));

/* Comments are generic: targetType "thread" + targetId is a forum
   reply; later targets (e.g. CC&R posts) reuse the same table.
   Moderation is soft-hide with an audit trail, never silent edits. */
export const comment = pgTable("comment", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  targetType: text("target_type").notNull().default("board"),
  targetId: text("target_id"),
  status: text("status").notNull().default("visible"),
  hiddenById: text("hidden_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  hiddenAt: timestamp("hidden_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const commentRelations = relations(comment, ({ one }) => ({
  author: one(user, { fields: [comment.userId], references: [user.id] }),
}));

/* Server-side rate limiting storage (login attempts, etc.) — in the
   database so limits hold across serverless instances. */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key"),
  count: integer("count"),
  lastRequest: bigint("last_request", { mode: "number" }),
});

/* Editorial content managed from /admin. Every item is a draft until
   published; publishedAt is stamped on first publish and drives
   ordering. Image and document columns hold private-blob pathnames
   served through /api/photos. */

export const newsStory = pgTable("news_story", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  kicker: text("kicker"),
  summary: text("summary"),
  body: text("body").notNull().default(""),
  imageKey: text("image_key"),
  imageAlt: text("image_alt"),
  pinned: boolean("pinned").notNull().default(false),
  status: text("status").notNull().default("draft"),
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* The Lighter Side — the humor column. With allowComments on, the
   comment thread doubles as caption-contest entries. */
export const lighterPost = pgTable("lighter_post", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  note: text("note"),
  imageKey: text("image_key"),
  imageAlt: text("image_alt"),
  allowComments: boolean("allow_comments").notNull().default(true),
  status: text("status").notNull().default("draft"),
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* Board updates: kind "update" (project news) or "minutes" (with an
   optional attached document, usually a PDF). */
export const boardPost = pgTable("board_post", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull().default("update"),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  meetingDate: text("meeting_date"),
  documentKey: text("document_key"),
  documentName: text("document_name"),
  status: text("status").notNull().default("draft"),
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const boardMember = pgTable("board_member", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position"),
  email: text("email"),
  phone: text("phone"),
  bio: text("bio"),
  photoKey: text("photo_key"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* CC&R Corner. The most recently published question is the
   Question of the Week; comments use targetType "ccr". */
export const ccrQuestion = pgTable("ccr_question", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  shortAnswer: text("short_answer"),
  answer: text("answer").notNull().default(""),
  sectionRef: text("section_ref"),
  status: text("status").notNull().default("draft"),
  authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* Editable site copy and photos (mission statement, hero, footer).
   Missing keys fall back to the defaults in lib/site.ts. */
export const siteSetting = pgTable("site_setting", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
