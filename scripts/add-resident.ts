import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] ?? "Resident";

  if (!email || !password) {
    console.error("Usage: tsx scripts/add-resident.ts <email> <password> [name]");
    process.exit(1);
  }

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
    console.error(`User already exists: ${email} (role: ${existing.role})`);
    process.exit(1);
  }

  const seedAuth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true, minPasswordLength: 6 },
  });

  await seedAuth.api.signUpEmail({ body: { email, password, name } });
  await db
    .update(schema.user)
    .set({ emailVerified: true })
    .where(eq(schema.user.email, email));

  console.log(`Resident account created: ${email} (role: resident)`);
}

main().then(() => process.exit(0));
