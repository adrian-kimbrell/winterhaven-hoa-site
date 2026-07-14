/**
 * Seeds fictional sample residents for the alpha demo. Display-only:
 * these users have no credential accounts and cannot sign in. All
 * emails end in .sample@example.com so they are easy to purge later.
 *
 * Usage: npx tsx scripts/seed-sample-residents.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

type SamplePet = { name: string; species: string; photoUrl?: string };
type SampleResident = {
  name: string;
  email: string;
  unit: string;
  phone: string;
  bio: string;
  facts: string;
  portraitUrl?: string;
  residenceFile?: string;
  pets: SamplePet[];
};

const RESIDENTS: SampleResident[] = [
  {
    name: "Margaret & Tom Ellis",
    email: "ellis.sample@example.com",
    unit: "12 Ocotillo Court",
    phone: "(555) 012-3847",
    bio: "Margaret taught third grade for thirty years and now runs the village book club with the same gentle authority. Tom, a retired civil engineer, spends his mornings on the loop trail before the heat sets in, photographing whatever the desert offers up.",
    facts: "Their courtyard garden — penstemon, agave, and one stubborn rosebush — wins the spring garden walk more years than not. They host the first porch gathering of every monsoon season.",
    portraitUrl: "https://i.pravatar.cc/400?img=32",
    residenceFile: "house.jpg",
    pets: [
      {
        name: "Biscuit",
        species: "Pembroke Welsh Corgi",
        photoUrl: "https://placedog.net/600/450?id=12",
      },
      { name: "Clementine", species: "Tabby cat", photoUrl: "https://placecats.com/400/300" },
    ],
  },
  {
    name: "Robin Calloway",
    email: "calloway.sample@example.com",
    unit: "4 Saguaro Lane",
    phone: "(555) 014-2210",
    bio: "A retired park ranger who spent twenty-two seasons in Saguaro National Park and still leads the village's full-moon walks. If you want to know what that bird was, ask Robin.",
    facts: "Keeps the village wildlife log — 67 bird species and counting. Makes prickly pear jelly every August and gives most of it away.",
    portraitUrl: "https://i.pravatar.cc/400?img=12",
    pets: [],
  },
  {
    name: "The Okafor Family",
    email: "okafor.sample@example.com",
    unit: "27 Palo Verde Drive",
    phone: "(555) 017-8834",
    bio: "Chidi teaches physics at the university; Amara runs a small ceramics studio out of the casita. Their twins can usually be found selling lemonade by the east gate on Saturdays.",
    facts: "Amara's luminarias line the commons every December. Mango has learned to imitate the quail and confuses everyone.",
    portraitUrl: "https://i.pravatar.cc/400?img=56",
    pets: [{ name: "Mango", species: "Parrot" }],
  },
  {
    name: "Hal & Dottie Schwartz",
    email: "schwartz.sample@example.com",
    unit: "9 Mesquite Way",
    phone: "(555) 019-4452",
    bio: "Hal captains the village pickleball ladder and claims the title is ceremonial; nobody believes him. Dottie quilts, and her monsoon-sky quilt hangs in the clubhouse.",
    facts: "Married fifty-one years. Hal makes the coffee for every board meeting and guards the recipe like a state secret.",
    portraitUrl: "https://i.pravatar.cc/400?img=68",
    pets: [
      { name: "Zeus", species: "Great Dane", photoUrl: "https://placedog.net/600/450?id=5" },
    ],
  },
  {
    name: "Priya Raman",
    email: "raman.sample@example.com",
    unit: "31 Cholla Vista",
    phone: "(555) 013-9917",
    bio: "A retired astronomer from Kitt Peak who says the village has the best amateur sky in Tucson. Hosts telescope nights on the commons whenever the moon cooperates.",
    facts: "Has a small dome observatory permit framed in the hallway. Will trade star talk for tamales.",
    portraitUrl: "https://i.pravatar.cc/400?img=47",
    pets: [],
  },
];

async function fetchBytes(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function main() {
  const { db } = await import("../lib/db");
  const schema = await import("../lib/schema");
  const { put } = await import("@vercel/blob");
  const { like } = await import("drizzle-orm");

  const already = await db.query.user.findMany({
    where: like(schema.user.email, "%.sample@example.com"),
  });
  if (already.length > 0) {
    console.error(
      `Found ${already.length} existing sample resident(s) — purge them first if you want to reseed.`
    );
    process.exit(1);
  }

  for (const r of RESIDENTS) {
    const userId = randomUUID();
    await db.insert(schema.user).values({
      id: userId,
      name: r.name,
      email: r.email,
      emailVerified: false,
      role: "resident",
    });

    let photoKey: string | null = null;
    if (r.portraitUrl) {
      const bytes = await fetchBytes(r.portraitUrl);
      if (bytes) {
        const blob = await put(`profiles/${userId}/${randomUUID()}.jpg`, bytes, {
          access: "private",
          contentType: "image/jpeg",
          addRandomSuffix: false,
        });
        photoKey = blob.pathname;
      }
    }

    let residencePhotoKey: string | null = null;
    if (r.residenceFile) {
      const bytes = readFileSync(join(__dirname, "..", "public", "img", r.residenceFile));
      const blob = await put(`residences/${userId}/${randomUUID()}.jpg`, bytes, {
        access: "private",
        contentType: "image/jpeg",
        addRandomSuffix: false,
      });
      residencePhotoKey = blob.pathname;
    }

    await db.insert(schema.profile).values({
      userId,
      optIn: true,
      unit: r.unit,
      phone: r.phone,
      bio: r.bio,
      facts: r.facts,
      photoKey,
      residencePhotoKey,
    });

    for (const p of r.pets) {
      let petPhotoKey: string | null = null;
      if (p.photoUrl) {
        const bytes = await fetchBytes(p.photoUrl);
        if (bytes) {
          const blob = await put(`pets/${userId}/${randomUUID()}.jpg`, bytes, {
            access: "private",
            contentType: "image/jpeg",
            addRandomSuffix: false,
          });
          petPhotoKey = blob.pathname;
        }
      }
      await db.insert(schema.pet).values({
        id: randomUUID(),
        userId,
        name: p.name,
        species: p.species,
        photoKey: petPhotoKey,
      });
    }
    console.log(`Seeded: ${r.name}`);
  }
  console.log("Done. Purge later with: DELETE users where email like %.sample@example.com");
}

main().then(() => process.exit(0));
