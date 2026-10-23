import { asc, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { boardMember, boardPost, ccrQuestion, lighterPost, newsStory } from "./schema";

/* Published-content reads shared by the homepage and section pages. */

export async function publishedNews(limit = 50) {
  const rows = await db
    .select()
    .from(newsStory)
    .where(eq(newsStory.status, "published"))
    .orderBy(desc(newsStory.publishedAt))
    .limit(limit);
  // The pinned story leads, whatever its date.
  return rows.sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

export async function publishedLighter(limit = 50) {
  return db
    .select()
    .from(lighterPost)
    .where(eq(lighterPost.status, "published"))
    .orderBy(desc(lighterPost.publishedAt))
    .limit(limit);
}

export async function publishedBoardPosts(limit = 100) {
  return db
    .select()
    .from(boardPost)
    .where(eq(boardPost.status, "published"))
    .orderBy(desc(boardPost.publishedAt))
    .limit(limit);
}

export async function boardMembers() {
  return db
    .select()
    .from(boardMember)
    .orderBy(asc(boardMember.sortOrder), asc(boardMember.name));
}

export async function publishedQuestions(limit = 100) {
  return db
    .select()
    .from(ccrQuestion)
    .where(eq(ccrQuestion.status, "published"))
    .orderBy(desc(ccrQuestion.publishedAt))
    .limit(limit);
}

/* A story's summary, or the start of its body when none was written. */
export function excerpt(summary: string | null, body: string, max = 220) {
  if (summary) return summary;
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).replace(/\s\S*$/, "")}…` : flat;
}
