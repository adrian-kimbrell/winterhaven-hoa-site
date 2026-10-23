import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";
import { del } from "@vercel/blob";

/* Test data lives in the real database, so it is fenced off by
   convention: accounts use the @e2e.test domain and content titles
   start with E2E_TAG. purgeTestData() removes all of it. */

export const E2E_DOMAIN = "e2e.test";
export const E2E_TAG = "[E2E]";
const STATE_DIR = join(__dirname, "..", ".auth");
const USERS_FILE = join(STATE_DIR, "users.json");
const SETTINGS_FILE = join(STATE_DIR, "settings-snapshot.json");

export type Role = "admin" | "alice" | "bob" | "carol" | "dave" | "erin" | "banned";
export type TestUser = { email: string; password: string; name: string };

export const sql = neon(process.env.DATABASE_URL!);

export function statePath(role: Role) {
  return join(STATE_DIR, `${role}.json`);
}

export function saveUsers(users: Record<Role, TestUser>) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function users(): Record<Role, TestUser> {
  return JSON.parse(readFileSync(USERS_FILE, "utf8"));
}

export async function snapshotSettings() {
  mkdirSync(STATE_DIR, { recursive: true });
  const rows = await sql`select key, value from site_setting`;
  writeFileSync(SETTINGS_FILE, JSON.stringify(rows));
}

export async function restoreSettings() {
  if (!existsSync(SETTINGS_FILE)) return;
  const rows: { key: string; value: string }[] = JSON.parse(readFileSync(SETTINGS_FILE, "utf8"));
  await sql`delete from site_setting`;
  for (const r of rows) {
    await sql`insert into site_setting (key, value) values (${r.key}, ${r.value})`;
  }
}

async function deleteBlobs(keys: (string | null)[]) {
  for (const k of keys) {
    if (!k) continue;
    try {
      await del(k);
    } catch {
      /* already gone */
    }
  }
}

export async function purgeTestData() {
  const tag = `${E2E_TAG}%`;
  const domain = `%@${E2E_DOMAIN}`;

  const contentBlobs = [
    ...(await sql`select image_key k from news_story where title like ${tag}`),
    ...(await sql`select image_key k from lighter_post where title like ${tag}`),
    ...(await sql`select document_key k from board_post where title like ${tag}`),
    ...(await sql`select photo_key k from board_member where name like ${tag}`),
  ].map((r) => r.k as string | null);
  const userBlobs = [
    ...(await sql`select p.photo_key k from profile p join "user" u on u.id = p.user_id where u.email like ${domain}`),
    ...(await sql`select p.residence_photo_key k from profile p join "user" u on u.id = p.user_id where u.email like ${domain}`),
    ...(await sql`select p.photo_key k from pet p join "user" u on u.id = p.user_id where u.email like ${domain}`),
  ].map((r) => r.k as string | null);

  const ccr = await sql`select id from ccr_question where question like ${tag}`;
  const lighter = await sql`select id from lighter_post where title like ${tag}`;
  const targetIds = [...ccr, ...lighter].map((r) => r.id as string);
  if (targetIds.length) {
    await sql`delete from comment where target_id = any(${targetIds})`;
  }
  await sql`delete from news_story where title like ${tag}`;
  await sql`delete from lighter_post where title like ${tag}`;
  await sql`delete from board_post where title like ${tag}`;
  await sql`delete from board_member where name like ${tag}`;
  await sql`delete from ccr_question where question like ${tag}`;
  // Threads and comments by test users cascade with the accounts.
  await sql`delete from "user" where email like ${domain}`;
  await sql`delete from rate_limit`;

  await deleteBlobs([...contentBlobs, ...userBlobs]);
}
