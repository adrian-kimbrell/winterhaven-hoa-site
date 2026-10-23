import { test, expect, users, signInViaForm } from "./support/fixtures";

/* What a visitor sees before signing in. */

const GATED = [
  ["/directory", "Resident Directory"],
  ["/news", "Community News"],
  ["/board", "From the Board"],
  ["/ccrs", "CC&R Corner"],
  ["/lighter", "The Lighter Side"],
  ["/community", "Community Board"],
] as const;

test("public homepage shows the mission and no resident content", async ({ page, pageErrors }) => {
  await page.goto("/");
  await expect(page.locator(".hero h1")).toBeVisible();
  await expect(page.locator("#about .mission")).not.toBeEmpty();
  await expect(page.locator(".about-photo img")).toBeVisible();
  // Signed-out nav: Home, About, Sign In only.
  await expect(page.locator(".hero-nav .nav-links a")).toHaveText(["Home", "About", "Sign In"]);
  // No resident sections, no forum topic titles.
  for (const id of ["#news", "#board", "#community", "#neighbors"]) {
    await expect(page.locator(id)).toHaveCount(0);
  }
  // Images actually load.
  const broken = await page.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src)
  );
  expect(broken).toEqual([]);
  void pageErrors;
});

test("About link scrolls to the about section", async ({ page, pageErrors }) => {
  await page.goto("/");
  await page.locator(".hero-actions a", { hasText: "About the Village" }).click();
  await expect(page).toHaveURL(/#about$/);
  await expect(page.locator("#about")).toBeInViewport();
  void pageErrors;
});

for (const [path, eyebrow] of GATED) {
  test(`${path} shows the residents-only gate`, async ({ page, pageErrors }) => {
    await page.goto(path);
    await expect(page.locator(".eyebrow").first()).toHaveText(eyebrow);
    await expect(page.locator(".gate-cta a", { hasText: "Resident Sign In" })).toHaveAttribute("href", "/login");
    await expect(page.locator(".gate-features li")).not.toHaveCount(0);
    void pageErrors;
  });
}

for (const path of ["/profile", "/admin", "/admin/news", "/admin/residents", "/news/x", "/ccrs/x", "/lighter/x", "/community/x", "/directory/x"]) {
  test(`${path} sends visitors to sign in`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("private photos need a session; public assets do not", async ({ request }) => {
  expect((await request.get("/api/photos/profiles/anything.jpg")).status()).toBe(401);
  expect((await request.get("/api/photos/news/anything.jpg")).status()).toBe(401);
  expect((await request.get("/api/photos/..%2F..%2Fetc/passwd")).status()).toBeGreaterThanOrEqual(400);
  expect((await request.get("/img/gate-sunset.jpg")).status()).toBe(200);
});

test("unknown pages 404", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
});

test("wrong password shows an error and stays on sign-in", async ({ page, pageErrors }) => {
  const result = await signInViaForm(page, users().alice.email, "definitely-wrong-password");
  expect(result).toContain("didn't work");
  await expect(page).toHaveURL(/\/login$/);
  void pageErrors;
});

test("suspended accounts cannot sign in", async ({ page, pageErrors }) => {
  const u = users().banned;
  const result = await signInViaForm(page, u.email, u.password);
  expect(result).not.toBe("ok");
  void pageErrors;
});
