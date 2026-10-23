/**
 * Fills in map coordinates for profiles that have an address but no
 * pin yet (profiles saved before the map existed). Safe to re-run.
 * Sends each address to the US Census geocoder.
 *
 * Usage: npx tsx scripts/geocode-profiles.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const [{ and, eq, isNotNull, isNull }, { db }, { profile }, { geocodeAddress }] =
    await Promise.all([
      import("drizzle-orm"),
      import("../lib/db"),
      import("../lib/schema"),
      import("../lib/geocode"),
    ]);
  const rows = await db
    .select({ userId: profile.userId, unit: profile.unit })
    .from(profile)
    .where(and(isNotNull(profile.unit), isNull(profile.latitude)));
  for (const row of rows) {
    const coords = await geocodeAddress(row.unit!);
    if (coords) await db.update(profile).set(coords).where(eq(profile.userId, row.userId));
    console.log(coords ? "pinned" : "no match", row.userId);
  }
}

main().then(() => process.exit(0));
