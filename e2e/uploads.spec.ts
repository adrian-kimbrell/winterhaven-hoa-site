import sharp from "sharp";
import { test, expect, expectImageLoaded } from "./support/fixtures";

/* Vercel refuses request bodies over 4.5 MB. Full-size phone photos
   must still upload (shrunk in the browser first), and oversized
   documents must be refused with a clear message. */

async function bigPhoto() {
  // Random noise compresses badly: a 4000×3000 JPEG of several MB.
  const raw = Buffer.alloc(4000 * 3000 * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = Math.imul(i, 2654435761) >>> 24;
  return sharp(raw, { raw: { width: 4000, height: 3000, channels: 3 } })
    .jpeg({ quality: 95 })
    .toBuffer();
}

test("a full-size phone photo uploads and is stored at a sensible size", async ({ as }) => {
  const photo = await bigPhoto();
  expect(photo.length).toBeGreaterThan(4.5 * 1024 * 1024);

  const page = await as("carol");
  await page.goto("/profile");
  await page.setInputFiles("#photo", { name: "IMG_0001.jpg", mimeType: "image/jpeg", buffer: photo });
  await expect(page.locator("text=Preparing photo")).toHaveCount(0);
  await page.click(".profile-form button[type='submit']");
  await expect(page.locator(".save-note")).toHaveText("Profile saved.");

  const img = page.locator(".current-photo").first();
  await expectImageLoaded(img);
  // The page shows a sized WebP copy made at upload, long-cached…
  const src = (await img.getAttribute("src"))!;
  expect(src).toMatch(/\.jpg\.w400\.webp$/);
  const thumb = await page.request.get(src);
  expect(thumb.headers()["content-type"]).toBe("image/webp");
  expect(thumb.headers()["cache-control"]).toContain("immutable");
  expect((await sharp(await thumb.body()).metadata()).width).toBe(400);
  // …and the original it was made from is capped at 2000px.
  const stored = await page.request.get(src.replace(/\.w400\.webp$/, ""));
  const meta = await sharp(await stored.body()).metadata();
  expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(2000);
  // Sizes that don't exist are refused rather than made on demand.
  expect((await page.request.get(src.replace(".w400.", ".w123."))).status()).toBe(404);
});

test("an oversized document is refused before upload", async ({ as }) => {
  const page = await as("admin");
  await page.goto("/admin/board/posts/new");
  const pdf = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(5 * 1024 * 1024, 32)]);
  await page.setInputFiles("#document", { name: "huge.pdf", mimeType: "application/pdf", buffer: pdf });
  await expect(page.locator(".field-error")).toContainText("limit is 4 MB");
  expect(await page.locator("#document").evaluate((i: HTMLInputElement) => i.files?.length)).toBe(0);
});
