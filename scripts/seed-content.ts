/**
 * Moves the alpha's placeholder content (formerly hardcoded in the
 * pages) into the database so it can be edited or deleted from /admin.
 * Each table is seeded only if it is empty, so re-running is safe.
 *
 * Usage: npx tsx scripts/seed-content.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import type { PgTable } from "drizzle-orm/pg-core";

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

async function main() {
  const [{ put }, { count }, { db }, schema] = await Promise.all([
    import("@vercel/blob"),
    import("drizzle-orm"),
    import("../lib/db"),
    import("../lib/schema"),
  ]);

  async function upload(file: string, prefix: string) {
    const body = readFileSync(join("public/img", file));
    const blob = await put(`${prefix}/${randomUUID()}.jpg`, body, {
      access: "private",
      addRandomSuffix: false,
      contentType: "image/jpeg",
    });
    return blob.pathname;
  }

  async function isEmpty(table: PgTable) {
    const [row] = await db.select({ n: count() }).from(table);
    return row.n === 0;
  }

  if (await isEmpty(schema.newsStory)) {
    await db.insert(schema.newsStory).values([
      {
        id: randomUUID(),
        title: "New native pollinator garden at the east gate",
        kicker: "Now blooming",
        summary:
          "Penstemon, fairy duster, and desert marigold are in, courtesy of the volunteer garden crew. The bees found it first.",
        body: "Penstemon, fairy duster, and desert marigold are in, courtesy of the volunteer garden crew.\n\nThe bees found it first, and the hummingbirds were close behind. The crew waters on Tuesday and Saturday mornings and welcomes extra hands.",
        imageKey: await upload("cactus-bloom-bee.jpg", "news"),
        imageAlt: "A honeybee inside a cactus bloom at Winterhaven Village",
        pinned: true,
        status: "published",
        publishedAt: ago(1),
      },
      {
        id: randomUUID(),
        title: "Pool resurfacing begins Monday",
        kicker: "Begins Monday",
        summary: "The pool closes for two weeks while the plaster is renewed.",
        body: "Swim laps under the Catalinas again soon. The pool closes for two weeks while the plaster is renewed and the coping stones are reset.\n\nThe spa stays open throughout.",
        status: "published",
        publishedAt: ago(2),
      },
      {
        id: randomUUID(),
        title: "Sunset potluck on the commons",
        kicker: "Saturday evening",
        summary: "Bring a dish and a lawn chair.",
        body: "Bring a dish and a lawn chair. The board provides lemonade, iced tea, and the sunset.",
        imageKey: await upload("rainbow-palms-v2.jpg", "news"),
        imageAlt: "Monsoon rainbow over the palms at Winterhaven Village",
        status: "published",
        publishedAt: ago(3),
      },
    ]);
    console.log("News: 3 stories");
  }

  if (await isEmpty(schema.lighterPost)) {
    await db.insert(schema.lighterPost).values({
      id: randomUUID(),
      title: "Caption contest: who is guarding whose wall?",
      body: "This hawk took up a post on a garden wall and declined to leave for most of an afternoon.\n\nGive it a caption. Best entry gets announced in next week's news.",
      note: "Captions close Friday.",
      imageKey: await upload("hawk-on-wall.jpg", "lighter"),
      imageAlt: "A hawk perched on a brick garden wall in front of oleanders",
      allowComments: true,
      status: "published",
      publishedAt: ago(1),
    });
    console.log("Lighter Side: 1 caption contest");
  }

  if (await isEmpty(schema.boardPost)) {
    await db.insert(schema.boardPost).values([
      {
        id: randomUUID(),
        kind: "update",
        title: "Clubhouse facelift: bids under review",
        body: "Proposals are being evaluated in two parts — structural work and cosmetic refresh. A recommendation goes to the board this month.",
        status: "published",
        publishedAt: ago(4),
      },
      {
        id: randomUUID(),
        kind: "minutes",
        title: "May board meeting",
        body: "Clubhouse bids, pool schedule, monsoon prep.",
        status: "published",
        publishedAt: ago(10),
      },
    ]);
    console.log("Board: 1 update, 1 minutes");
  }

  if (await isEmpty(schema.ccrQuestion)) {
    await db.insert(schema.ccrQuestion).values([
      {
        id: randomUUID(),
        question: "Do I need approval to repaint my front door?",
        shortAnswer: "Only if the color changes.",
        answer: "The approved palette is in the appendix, and anything on it is pre-approved.",
        status: "published",
        publishedAt: ago(14),
      },
      {
        id: randomUUID(),
        question: "Can I park my RV in my driveway overnight?",
        shortAnswer: "Yes, briefly.",
        answer: "Up to 72 hours for loading and unloading — the CC&Rs explain the details and how to request an extension.",
        status: "published",
        publishedAt: ago(2),
      },
    ]);
    console.log("CC&Rs: 2 questions");
  }

  console.log("Done. Placeholder content can now be edited or deleted at /admin.");
}

main().then(() => process.exit(0));
