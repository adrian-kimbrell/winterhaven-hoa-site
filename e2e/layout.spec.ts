import { test, expect } from "./support/fixtures";

/* Desktop layout: sticky headers and the homepage nav's two states. */

test("homepage nav is transparent over the photo, solid past it", async ({ as }) => {
  const page = await as("alice");
  await page.goto("/");
  const nav = page.locator(".hero-nav");
  await expect(nav).not.toHaveClass(/hero-nav-solid/);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await expect(nav).toHaveClass(/hero-nav-solid/);
  expect((await nav.boundingBox())!.y).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(nav).not.toHaveClass(/hero-nav-solid/);
});

for (const [role, path, selector] of [
  ["alice", "/news", ".site-header"],
  ["admin", "/admin/site", ".admin-top"],
] as const) {
  test(`${selector} stays pinned on ${path}`, async ({ as }) => {
    const page = await as(role);
    await page.goto(path);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(100);
    expect((await page.locator(selector).boundingBox())!.y).toBe(0);
  });
}

test("every page has one h1 and a title", async ({ as }) => {
  const page = await as("admin");
  for (const path of ["/", "/news", "/board", "/ccrs", "/lighter", "/community", "/directory", "/profile", "/admin", "/admin/site"]) {
    await page.goto(path);
    await expect(page.locator("h1"), path).toHaveCount(1);
    expect(await page.title(), path).not.toBe("");
  }
});
