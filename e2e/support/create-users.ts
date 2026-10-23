/* Creates the throwaway test accounts. Run by global-setup through
   tsx, because better-auth is ESM-only and Playwright's loader
   compiles setup files to CommonJS. Prints the accounts as JSON. */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { randomBytes } from "crypto";

const DOMAIN = "e2e.test";
const PEOPLE = {
  admin: { name: "E2E Admin", role: "admin" },
  alice: { name: "E2E Alice", role: "resident" },
  bob: { name: "E2E Bob", role: "resident" },
  carol: { name: "E2E Carol", role: "resident" },
  dave: { name: "E2E Dave", role: "resident" },
  erin: { name: "E2E Erin", role: "resident" },
  banned: { name: "E2E Banned", role: "resident", banned: true },
} as const;

async function main() {
  const [{ betterAuth }, { drizzleAdapter }, { db }, schema, { eq }] = await Promise.all([
    import("better-auth"),
    import("better-auth/adapters/drizzle"),
    import("../../lib/db"),
    import("../../lib/schema"),
    import("drizzle-orm"),
  ]);
  // Same approach as scripts/seed-admin.ts: a local instance with
  // signup enabled, used only to create accounts.
  const seedAuth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true, minPasswordLength: 10 },
  });

  const users: Record<string, { email: string; password: string; name: string }> = {};
  for (const [role, p] of Object.entries(PEOPLE)) {
    const user = {
      email: `e2e-${role}@${DOMAIN}`,
      password: `E2e-${randomBytes(9).toString("base64url")}`,
      name: p.name,
    };
    await seedAuth.api.signUpEmail({ body: user });
    await db
      .update(schema.user)
      .set({ role: p.role, emailVerified: true, banned: "banned" in p && p.banned })
      .where(eq(schema.user.email, user.email));
    users[role] = user;
  }
  process.stdout.write(JSON.stringify(users));
}

main().then(() => process.exit(0));
