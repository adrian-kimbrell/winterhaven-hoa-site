import { test, expect, noHorizontalOverflow } from "./support/fixtures";

/* Phone width: nothing scrolls sideways, on any page. */

const PUBLIC = ["/", "/login", "/news", "/directory"];
const RESIDENT = ["/", "/news", "/board", "/ccrs", "/lighter", "/community", "/directory", "/profile"];
const ADMIN = ["/admin", "/admin/news", "/admin/news/new", "/admin/lighter/new", "/admin/board", "/admin/board/posts/new", "/admin/board/members/new", "/admin/ccrs/new", "/admin/residents", "/admin/residents/new", "/admin/site"];

for (const path of PUBLIC) {
  test(`visitor ${path} fits a phone`, async ({ page, pageErrors }) => {
    await page.goto(path);
    expect(await noHorizontalOverflow(page)).toBe(true);
    void pageErrors;
  });
}

test("resident pages fit a phone", async ({ as }) => {
  const page = await as("alice");
  for (const path of RESIDENT) {
    await page.goto(path);
    expect(await noHorizontalOverflow(page), path).toBe(true);
  }
});

test("admin pages fit a phone", async ({ as }) => {
  const page = await as("admin");
  for (const path of ADMIN) {
    await page.goto(path);
    expect(await noHorizontalOverflow(page), path).toBe(true);
  }
});

test("phone menu: a short pinned bar that opens, navigates, and closes", async ({ as }) => {
  const page = await as("alice");
  await page.goto("/news");
  const header = page.locator(".site-header");
  const links = page.locator("#site-menu");
  expect((await header.boundingBox())!.height).toBeLessThan(90);
  await expect(links).toBeHidden();

  await page.click(".nav-toggle");
  await expect(page.locator(".nav-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect(links).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(links).toBeHidden();

  await page.click(".nav-toggle");
  await links.getByRole("link", { name: "Community Board" }).click();
  await page.waitForURL("**/community");
  await expect(page.locator("#site-menu")).toBeHidden();

  // Still pinned after scrolling.
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect.poll(async () => (await header.boundingBox())!.y).toBe(0);
});

test("admin tabs stay on one row", async ({ as }) => {
  const page = await as("admin");
  await page.goto("/admin/news");
  const tabs = page.locator(".admin-tabs a");
  const tops = new Set(await tabs.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top))));
  expect(tops.size).toBe(1);
  expect(await noHorizontalOverflow(page)).toBe(true);
});
