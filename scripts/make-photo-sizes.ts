/* Makes the sized WebP copies (lib/photo-sizes.ts) for photos uploaded
   before sizes existed. Safe to re-run: only missing copies are made.
   The photo proxy would also make them on first view; this just saves
   the first visitor the wait.

   Run: npx tsx scripts/make-photo-sizes.ts */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { get, list } from "@vercel/blob";
import { PHOTO_WIDTHS, parseSizedKey, sizedKey } from "../lib/photo-sizes";
import { storeSize } from "../lib/uploads";

async function main() {
  const keys = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });
    for (const b of page.blobs) keys.add(b.pathname);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const photos = [...keys].filter(
    (k) => /\.(jpg|png|webp)$/.test(k) && !parseSizedKey(k)
  );
  let made = 0;
  for (const key of photos) {
    const missing = PHOTO_WIDTHS.filter((w) => !keys.has(sizedKey(key, w)));
    if (missing.length === 0) continue;
    const original = await get(key, { access: "private" });
    if (!original || original.statusCode !== 200) continue;
    const body = Buffer.from(await new Response(original.stream).arrayBuffer());
    for (const w of missing) await storeSize(key, body, w);
    made += missing.length;
    console.log(`${key}: made ${missing.join(", ")}`);
  }
  console.log(`${photos.length} photos, ${made} sizes made.`);
}

main();
