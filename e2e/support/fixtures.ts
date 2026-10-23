import { randomInt } from "crypto";
import { test as base, expect, type Locator, type Page, type BrowserContext } from "@playwright/test";
import { type Role, statePath, users } from "./data";

/* Every test fails if the page throws, logs a console error, or any
   request comes back 5xx. Expected 4xx responses (e.g. the 401 on a
   private photo when signed out) are not errors. */
type Fixtures = {
  pageErrors: string[];
  as: (role: Role) => Promise<Page>;
};

function watch(page: Page, errors: string[]) {
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    // Chrome logs failed resource loads as console errors; 4xx are
    // asserted explicitly where they matter.
    if (/Failed to load resource: the server responded with a status of 4\d\d/.test(text)) return;
    errors.push(`console: ${text}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 500) errors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });
}

/* Sign-in is rate limited per client IP (3 per 10 s). Each browser
   context gets its own made-up address so parallel tests don't share
   one bucket; the local server passes x-forwarded-for through. The
   header goes only to our own server: third parties (the map tiles)
   reject it in CORS preflights. */
export function fakeIp() {
  return `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
}

async function useFakeIp(ctx: BrowserContext, baseURL: string | undefined) {
  const ip = fakeIp();
  await ctx.route(`${baseURL}/**`, (route) =>
    route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": ip } })
  );
}

export const test = base.extend<Fixtures>({
  context: async ({ context, baseURL }, use) => {
    await useFakeIp(context, baseURL);
    await use(context);
  },
  pageErrors: async ({ page }, use) => {
    const errors: string[] = [];
    watch(page, errors);
    await use(errors);
    expect(errors, "page errors, console errors, or 5xx responses").toEqual([]);
  },
  // A page signed in as the given test user, in its own context, with
  // the project's device settings (so mobile tests really are mobile).
  as: async (
    { browser, baseURL, viewport, userAgent, isMobile, hasTouch, deviceScaleFactor },
    use
  ) => {
    const contexts: BrowserContext[] = [];
    const errors: string[] = [];
    await use(async (role) => {
      const ctx = await browser.newContext({
        storageState: statePath(role),
        baseURL,
        viewport,
        userAgent,
        isMobile,
        hasTouch,
        deviceScaleFactor,
      });
      await useFakeIp(ctx, baseURL);
      contexts.push(ctx);
      const page = await ctx.newPage();
      watch(page, errors);
      return page;
    });
    for (const c of contexts) await c.close();
    expect(errors, "page errors, console errors, or 5xx responses").toEqual([]);
  },
});

export { expect, users };

export const TINY_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"
);

/* Sign in through the real form. Waits out the sign-in rate limit
   (3 per 10 s) instead of failing on it. */
export async function signInViaForm(page: Page, email: string, password: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');
    const outcome = await Promise.race([
      page.waitForURL((u) => u.pathname === "/", { timeout: 15_000 }).then(() => "ok"),
      page.locator(".auth-error").waitFor({ timeout: 15_000 }).then(() => "error"),
    ]);
    if (outcome === "ok") return "ok" as const;
    const msg = await page.locator(".auth-error").textContent();
    if (!msg?.includes("Too many attempts")) return msg ?? "error";
    await page.waitForTimeout(4000);
  }
  return "rate-limited";
}

/* Waits for an image to finish loading (scrolling it into view first,
   since next/image lazy-loads) and checks it decoded. */
export async function expectImageLoaded(img: Locator) {
  await img.scrollIntoViewIfNeeded();
  await expect
    .poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), {
      message: "image loaded",
    })
    .toBe(true);
}

export async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}
