import { randomUUID } from "crypto";
import { test, expect, expectImageLoaded } from "./support/fixtures";
import { E2E_TAG, sql } from "./support/data";

/* The signed-in resident experience. Content is inserted directly so
   these tests don't depend on whatever the committee has published. */

// Unique per worker: a retried worker re-runs beforeAll.
const run = randomUUID().slice(0, 6);
const ids = {
  news: randomUUID(),
  draft: randomUUID(),
  ccr: randomUUID(),
  lighter: randomUUID(),
  board: randomUUID(),
};

test.beforeAll(async () => {
  const now = new Date();
  await sql`insert into news_story (id, title, kicker, summary, body, status, published_at)
            values (${ids.news}, ${`${E2E_TAG} Resident news ${run}`}, 'Today', 'A summary.', ${"First para.\n\nSecond para."}, 'published', ${now})`;
  await sql`insert into news_story (id, title, body, status)
            values (${ids.draft}, ${`${E2E_TAG} Secret draft ${run}`}, 'Not yet.', 'draft')`;
  await sql`insert into ccr_question (id, question, short_answer, answer, section_ref, status, published_at)
            values (${ids.ccr}, ${`${E2E_TAG} Can I keep chickens? ${run}`}, 'No.', 'Poultry is not permitted.', 'Section 9', 'published', ${now})`;
  await sql`insert into lighter_post (id, title, body, note, allow_comments, status, published_at)
            values (${ids.lighter}, ${`${E2E_TAG} Caption this ${run}`}, 'A javelina at the pool.', 'Closes Friday.', true, 'published', ${now})`;
  await sql`insert into board_post (id, kind, title, body, meeting_date, status, published_at)
            values (${ids.board}, 'minutes', ${`${E2E_TAG} October meeting ${run}`}, 'Budget approved.', '2026-10-01', 'published', ${now})`;
});

test("resident homepage has every section", async ({ as }) => {
  const page = await as("alice");
  await page.goto("/");
  await expect(page.locator(".hero h1")).toHaveText("Welcome home, E2E.");
  for (const id of ["#news", "#board", "#ccr", "#community", "#neighbors"]) {
    await expect(page.locator(id)).toBeVisible();
  }
  await expect(page.locator(".lighter blockquote")).toBeVisible();
  // Every link on the page resolves.
  const hrefs = await page.locator("main a[href^='/']").evaluateAll((as) =>
    [...new Set(as.map((a) => a.getAttribute("href")!.split("#")[0]))]
  );
  for (const href of hrefs) {
    const res = await page.request.get(href);
    expect(res.status(), href).toBeLessThan(400);
  }
});

test("nav reaches every section", async ({ as }) => {
  const page = await as("alice");
  await page.goto("/news");
  for (const label of ["Directory", "News", "Board", "CC&Rs", "Lighter Side", "Community Board", "My Profile"]) {
    await page.locator(".site-header .nav-links a", { hasText: label }).first().click();
    await expect(page.locator(".site-header a.active")).toHaveText(label);
  }
});

test("news list, story page, and drafts stay hidden", async ({ as }) => {
  const page = await as("alice");
  await page.goto("/news");
  await expect(page.locator(".story-title", { hasText: `${E2E_TAG} Resident news ${run}` })).toBeVisible();
  await expect(page.locator(".story-title", { hasText: "Secret draft" })).toHaveCount(0);
  await page.locator("a.story", { hasText: `${E2E_TAG} Resident news ${run}` }).click();
  await expect(page).toHaveURL(`/news/${ids.news}`);
  await expect(page.locator(".article-body p")).toHaveText(["First para.", "Second para."]);
  const res = await page.goto(`/news/${ids.draft}`);
  expect(res?.status()).toBe(404);
});

test("board page shows minutes with the meeting date", async ({ as }) => {
  const page = await as("alice");
  await page.goto("/board");
  const post = page.locator(`#post-${ids.board}`);
  await expect(post).toContainText("Meeting of October 1, 2026");
  await expect(post).toContainText("Budget approved.");
});

test("CC&R question: read, comment, delete own comment", async ({ as }) => {
  const page = await as("alice");
  await page.goto("/ccrs");
  await page.goto(`/ccrs/${ids.ccr}`);
  await expect(page.locator("h1")).toContainText("Can I keep chickens?");
  await expect(page.locator(".article-note")).toHaveText("See Section 9 of the CC&Rs.");
  const text = `Comment ${randomUUID()}`;
  await page.fill("#comments textarea", text);
  await page.click("#comments form.board-form button[type='submit']");
  const mine = page.locator(".comment-item", { hasText: text });
  await expect(mine).toBeVisible();
  await expect(mine.locator(".comment-author")).toHaveText("E2E Alice");
  // Posting again immediately trips the cooldown.
  await page.fill("#comments textarea", "Second one too fast");
  await page.click("#comments form.board-form button[type='submit']");
  await expect(page.locator("#comments .auth-error")).toContainText("quickly");
  await mine.locator("button", { hasText: "Delete" }).click();
  await expect(page.locator(".comment-item", { hasText: text })).toHaveCount(0);
});

test("Lighter Side: caption entry appears for other residents", async ({ as }) => {
  const carol = await as("carol");
  await carol.goto("/lighter");
  await carol.locator(`a.thread-row[href='/lighter/${ids.lighter}']`).click();
  await expect(carol.locator(".lighter-quote")).toHaveText(`${E2E_TAG} Caption this ${run}`);
  const caption = `Pool party crasher ${randomUUID().slice(0, 6)}`;
  await carol.fill("#comments textarea", caption);
  await carol.click("#comments form.board-form button[type='submit']");
  await expect(carol.locator(".comment-item", { hasText: caption })).toBeVisible();

  const alice = await as("alice");
  await alice.goto(`/lighter/${ids.lighter}`);
  const entry = alice.locator(".comment-item", { hasText: caption });
  await expect(entry).toBeVisible();
  // Not hers: no delete or hide controls.
  await expect(entry.locator("button")).toHaveCount(0);
});

test("community board: start a topic, reply, see it on the homepage", async ({ as }) => {
  const bob = await as("bob");
  await bob.goto("/community");
  const title = `${E2E_TAG} Topic ${randomUUID().slice(0, 6)}`;
  await bob.locator(".new-topic summary").click();
  await bob.fill("#title", title);
  await bob.fill(".new-topic textarea", "Anyone have a ladder?");
  await bob.click(".new-topic button[type='submit']");
  await expect(bob.locator("h1")).toContainText(title);
  await bob.fill(".board-form textarea", "Never mind, found one.");
  await bob.click(".board-form button[type='submit']");
  await expect(bob.locator(".comment-item", { hasText: "found one" })).toBeVisible();
  await expect(bob.locator(".replies-head")).toHaveText("1 Reply");
  // Has a reply now, so the author can no longer delete the topic.
  await expect(bob.locator(".thread-post button", { hasText: "Delete" })).toHaveCount(0);

  const alice = await as("alice");
  await alice.goto("/");
  await expect(alice.locator("#community .thread-title", { hasText: title })).toBeVisible();
});

test("profile: fill in, opt in, add a pet with a photo, appear in the directory", async ({ as }) => {
  const page = await as("alice");
  await page.goto("/profile");
  await page.fill("#unit", "1 Test Lane");
  await page.fill("#phone", "(555) 000-0000");
  await page.fill("#bio", "Testing, testing.");
  await page.locator("input[name='optIn']").check();
  await page.setInputFiles("#photo", "e2e/fixtures/photo.jpg");
  await page.click(".profile-form button[type='submit']");
  await expect(page.locator(".save-note")).toHaveText("Profile saved.");
  await expect(page.locator(".current-photo").first()).toBeVisible();

  await page.fill("#pet-name", "Biscuit");
  await page.fill("#pet-species", "Corgi");
  await page.setInputFiles("#pet-photo", "e2e/fixtures/photo.jpg");
  await page.locator("form:has(#pet-name) button[type='submit']").click();
  await expect(page.locator(".pet-row", { hasText: "Biscuit" })).toBeVisible();

  const bob = await as("bob");
  await bob.goto("/directory");
  const card = bob.locator(".person-card", { hasText: "E2E Alice" });
  await expect(card).toBeVisible();
  await card.click();
  await expect(bob.locator("main")).toContainText("1 Test Lane");
  await expect(bob.locator("main")).toContainText("Biscuit");
  for (const img of await bob.locator("main img").all()) await expectImageLoaded(img);

  // Opting out hides the listing from neighbors.
  await page.locator("input[name='optIn']").uncheck();
  await page.click(".profile-form button[type='submit']");
  await expect(page.locator(".save-note")).toBeVisible();
  await bob.goto("/directory");
  await expect(bob.locator(".person-card", { hasText: "E2E Alice" })).toHaveCount(0);

  await page.locator(".pet-row", { hasText: "Biscuit" }).locator("button").click();
  await expect(page.locator(".pet-row", { hasText: "Biscuit" })).toHaveCount(0);
});

test("profile: residents can change their name, and it shows in the directory", async ({ as }) => {
  const page = await as("carol");
  await page.goto("/profile");
  const original = await page.inputValue("#name");
  const renamed = `${original} Renamed`;

  await page.fill("#name", "   ");
  await page.click(".profile-form button[type='submit']");
  // Spaces pass the browser's required check; the server refuses them.
  await expect(page.locator(".auth-error")).toHaveText("Your name can't be blank.");
  await expect(page.locator("#name")).toHaveValue(original);

  await page.fill("#name", renamed);
  await page.locator("input[name='optIn']").check();
  await page.click(".profile-form button[type='submit']");
  await expect(page.locator(".save-note")).toHaveText("Profile saved.");
  await expect(page.locator("#name")).toHaveValue(renamed);

  const bob = await as("bob");
  await bob.goto("/directory");
  await expect(bob.locator(".person-card", { hasText: renamed })).toBeVisible();

  await page.fill("#name", original);
  await page.locator("input[name='optIn']").uncheck();
  await page.click(".profile-form button[type='submit']");
  await expect(page.locator("#name")).toHaveValue(original);
});

test("directory: a geocoded address shows a map pin", async ({ as, browser, baseURL }) => {
  test.skip(!process.env.MAPBOX_TOKEN, "MAPBOX_TOKEN is not set, so no map is shown");
  const [{ id }] = await sql`select id from "user" where email = 'e2e-dave@e2e.test'`;
  // Coordinates are set directly so the test never calls the geocoder.
  await sql`insert into profile (user_id, opt_in, unit, latitude, longitude)
            values (${id}, true, '1 Test Lane', 32.2731, -110.9271)
            on conflict (user_id) do update set opt_in = true, unit = '1 Test Lane',
              latitude = 32.2731, longitude = -110.9271`;
  const bob = await as("bob");
  await bob.goto(`/directory/${id}`);
  const map = bob.locator(".resident-map img");
  await expect(map).toHaveAttribute("src", `/api/map/${id}`);
  await expectImageLoaded(map);
  // The page never carries the coordinates or the token.
  expect(await bob.content()).not.toContain("-110.9271");
  const visitor = await browser.newContext({ baseURL });
  expect((await visitor.request.get(`/api/map/${id}`)).status()).toBe(401);
  await visitor.close();

  await sql`update profile set latitude = null, longitude = null where user_id = ${id}`;
  await bob.reload();
  await expect(bob.locator(".resident-map")).toHaveCount(0);
  await sql`delete from profile where user_id = ${id}`;
});

test("residents cannot edit someone else's profile", async ({ as }) => {
  const [{ id: aliceId }] = await sql`select id from "user" where email = 'e2e-alice@e2e.test'`;
  const bob = await as("bob");
  await bob.goto(`/profile?for=${aliceId}`);
  // The parameter is ignored for non-admins: Bob gets his own profile.
  await expect(bob.locator("h1")).toHaveText("My Profile");
});

test("user content is rendered as text, never as HTML", async ({ as }) => {
  const carol = await as("carol");
  await carol.goto("/community");
  await carol.locator(".new-topic summary").click();
  await carol.fill("#title", `${E2E_TAG} <img src=x onerror=alert(1)>`);
  await carol.fill(".new-topic textarea", "<script>window.__xss = 1</script>");
  await carol.click(".new-topic button[type='submit']");
  await expect(carol.locator("h1")).toContainText("<img src=x");
  expect(await carol.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
});
