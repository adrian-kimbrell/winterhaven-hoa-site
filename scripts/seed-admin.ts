/**
 * Creates the initial admin account. Usage:
 *   ADMIN_EMAIL=you@example.com [ADMIN_PASSWORD=...] npm run seed:admin
 * If ADMIN_PASSWORD is omitted, a random temporary password is generated
 * and printed once — sign in and change it.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { randomBytes } from "crypto";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    console.error("Set ADMIN_EMAIL (and optionally ADMIN_PASSWORD).");
    process.exit(1);
  }
  const name = process.env.ADMIN_NAME ?? "Site Admin";
  const generated = !process.env.ADMIN_PASSWORD;
  const password =
    process.env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");

  const [{ betterAuth }, { drizzleAdapter }, { db }, schema, { eq }] =
    await Promise.all([
      import("better-auth"),
      import("better-auth/adapters/drizzle"),
      import("../lib/db"),
      import("../lib/schema"),
      import("drizzle-orm"),
    ]);

  const existing = await db.query.user.findFirst({
    where: eq(schema.user.email, email),
  });
  if (existing) {
    console.error(`A user with email ${email} already exists (role: ${existing.role}).`);
    process.exit(1);
  }

  // A local auth instance with signup enabled, only for seeding — the app
  // itself keeps public signup disabled.
  const seedAuth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true, minPasswordLength: 10 },
  });

  await seedAuth.api.signUpEmail({ body: { email, password, name } });
  await db
    .update(schema.user)
    .set({ role: "admin", emailVerified: true })
    .where(eq(schema.user.email, email));

  console.log(`Admin account created: ${email}`);
  if (generated) {
    console.log(`Temporary password: ${password}`);
    console.log("Sign in and change it right away.");
  }
}

main().then(() => process.exit(0));
