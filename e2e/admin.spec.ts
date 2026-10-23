import { randomUUID } from "crypto";
import type { Page } from "@playwright/test";
import { test, expect, users, signInViaForm, TINY_PDF, expectImageLoaded } from "./support/fixtures";
import { E2E_TAG } from "./support/data";

/* Every admin module, end to end: create, draft vs. published
   visibility, edit, moderate, delete. Erin is the resident who checks
   what neighbors actually see. */

test.describe.configure({ mode: "serial" });

const idFrom = (page: Page) => new URL(page.url()).pathname.split("/").pop()!;
const short = () => randomUUID().slice(0, 6);

/* Clicks a server-action submit button and waits for the action to
   finish (the URL may not change when re-saving the same item). */
async function save(page: Page, selector: string) {
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && r.status() < 400),
    page.click(selector),
  ]);
  await page.waitForLoadState("networkidle");
}

async function deleteItem(page: Page) {
  await page.locator(".danger-zone input[name='confirm']").check();
  await page.locator(".danger-zone .btn-danger").click();
  await expect(page).toHaveURL(/deleted=/);
}

test("overview links to every module", async ({ as }) => {
  const admin = await as("admin");
  await admin.goto("/admin");
  await expect(admin.locator(".admin-card h2")).toHaveText([
    "Community News",
    "The Lighter Side",
    "Board Updates & Minutes",
    "CC&R Corner",
    "Residents & Accounts",
    "Site Settings",
    "Community Board",
  ]);
  for (const tab of ["News", "Lighter Side", "Board", "CC&Rs", "Residents", "Site Settings", "Overview"]) {
    await admin.locator(".admin-tabs a", { hasText: tab }).click();
    await expect(admin.locator(".admin-tabs a.active")).toHaveText(tab);
  }
});

test("news: draft, preview, publish, lead story, edit, delete", async ({ as }) => {
  const admin = await as("admin");
  const erin = await as("erin");
  const title = `${E2E_TAG} Story ${short()}`;

  await admin.goto("/admin/news/new");
  await admin.fill("#title", title);
  await admin.fill("#kicker", "This week");
  await admin.fill("#summary", "Short summary.");
  await admin.fill("#body", "Para one.\n\nPara two.");
  await admin.setInputFiles("#image", "e2e/fixtures/photo.jpg");
  await admin.fill("#imageAlt", "A hummingbird");
  await save(admin, "button[value='draft']");
  await expect(admin).toHaveURL(/saved=draft/);
  const id = idFrom(admin);

  // Draft: hidden from residents, previewable by admins.
  expect((await erin.goto(`/news/${id}`))?.status()).toBe(404);
  await admin.goto(`/news/${id}`);
  await expect(admin.locator(".auth-error")).toContainText("Draft preview");
  await expectImageLoaded(admin.locator(".article-photo img"));

  await admin.goto(`/admin/news/${id}`);
  await admin.locator("input[name='pinned']").check();
  await save(admin, "button[value='publish']");
  await expect(admin).toHaveURL(/saved=published/);
  await expect(admin.locator(".pill-live")).toHaveText("Published");

  await erin.goto("/");
  await expect(erin.locator(".news-lead h3")).toHaveText(title);
  await expectImageLoaded(erin.locator(".news-lead img"));
  await erin.goto(`/news/${id}`);
  await expect(erin.locator(".article-body p")).toHaveText(["Para one.", "Para two."]);

  // Edit keeps it published and updates the page.
  await admin.goto(`/admin/news/${id}`);
  await admin.fill("#title", `${title} (updated)`);
  await admin.locator("input[name='pinned']").uncheck();
  await save(admin, "button[value='publish']");
  await erin.goto(`/news/${id}`);
  await expect(erin.locator("h1")).toHaveText(`${title} (updated)`);

  // Unpublish hides it again.
  await admin.goto(`/admin/news/${id}`);
  await save(admin, "button[value='draft']");
  expect((await erin.goto(`/news/${id}`))?.status()).toBe(404);

  await admin.goto(`/admin/news/${id}`);
  await deleteItem(admin);
  await expect(admin.locator(".thread-title", { hasText: title })).toHaveCount(0);
});

test("lighter side: comments toggle, caption contest, moderation", async ({ as }) => {
  const admin = await as("admin");
  const erin = await as("erin");
  const title = `${E2E_TAG} Quip ${short()}`;

  await admin.goto("/admin/lighter/new");
  await admin.fill("#title", title);
  await admin.fill("#note", "Captions close Friday.");
  await admin.locator("input[name='allowComments']").uncheck();
  await save(admin, "button[value='publish']");
  await expect(admin).toHaveURL(/saved=published/);
  const id = idFrom(admin);

  await erin.goto(`/lighter/${id}`);
  await expect(erin.locator(".lighter-quote")).toHaveText(title);
  await expect(erin.locator("#comments")).toHaveCount(0);

  await admin.goto(`/admin/lighter/${id}`);
  await admin.locator("input[name='allowComments']").check();
  await save(admin, "button[value='publish']");

  await erin.goto(`/lighter/${id}`);
  const caption = `Erin's caption ${short()}`;
  await erin.fill("#comments textarea", caption);
  await erin.click("#comments form.board-form button[type='submit']");
  await expect(erin.locator(".comment-item", { hasText: caption })).toBeVisible();

  // Hide: gone for residents, kept (marked) for admins.
  await admin.goto(`/lighter/${id}`);
  const entry = admin.locator(".comment-item", { hasText: caption });
  await Promise.all([
    admin.waitForResponse((r) => r.request().method() === "POST"),
    entry.locator("button", { hasText: "Hide" }).click(),
  ]);
  await expect(entry.locator(".pill")).toHaveText("Hidden");
  await erin.reload();
  await expect(erin.locator(".comment-item", { hasText: caption })).toHaveCount(0);

  await Promise.all([
    admin.waitForResponse((r) => r.request().method() === "POST"),
    entry.locator("button", { hasText: "Unhide" }).click(),
  ]);
  await erin.reload();
  await expect(erin.locator(".comment-item", { hasText: caption })).toBeVisible();

  await admin.goto(`/admin/lighter/${id}`);
  await deleteItem(admin);
  expect((await erin.goto(`/lighter/${id}`))?.status()).toBe(404);
});

test("board: minutes with a PDF, and a board member with a photo", async ({ as }) => {
  const admin = await as("admin");
  const erin = await as("erin");
  const title = `${E2E_TAG} Minutes ${short()}`;

  await admin.goto("/admin/board/posts/new");
  await admin.locator("input[name='kind'][value='minutes']").check();
  await admin.fill("#title", title);
  await admin.fill("#meetingDate", "2026-10-15");
  await admin.fill("#body", "Quorum present.");
  await admin.setInputFiles("#document", { name: "minutes.pdf", mimeType: "application/pdf", buffer: TINY_PDF });
  await save(admin, "button[value='publish']");
  await expect(admin).toHaveURL(/saved=published/);
  const postId = idFrom(admin);

  await erin.goto("/board");
  const post = erin.locator(`#post-${postId}`);
  await expect(post).toContainText("Meeting of October 15, 2026");
  const href = await post.locator("a", { hasText: "Open the minutes" }).getAttribute("href");
  const pdf = await erin.request.get(href!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");

  const name = `${E2E_TAG} Pat Member ${short()}`;
  await admin.goto("/admin/board/members/new");
  await admin.fill("#name", name);
  await admin.fill("#position", "Treasurer");
  await admin.fill("#email", "pat@e2e.test");
  await admin.fill("#bio", "Counts things.");
  await admin.setInputFiles("#photo", "e2e/fixtures/photo.jpg");
  await save(admin, "form.editor-form button[type='submit']");
  await expect(admin.locator(".save-note")).toBeVisible();
  const memberId = idFrom(admin);

  await erin.goto("/board");
  const card = erin.locator(".member-card", { hasText: name });
  await expect(card).toContainText("Treasurer");
  await expect(card.locator("a[href='mailto:pat@e2e.test']")).toBeVisible();
  await expectImageLoaded(card.locator("img"));

  await admin.goto(`/admin/board/members/${memberId}`);
  await deleteItem(admin);
  await admin.goto(`/admin/board/posts/${postId}`);
  await deleteItem(admin);
  await erin.goto("/board");
  await expect(erin.locator(".member-card", { hasText: name })).toHaveCount(0);
  await expect(erin.locator(`#post-${postId}`)).toHaveCount(0);
});

test("CC&Rs: newest published question becomes Question of the Week", async ({ as }) => {
  const admin = await as("admin");
  const erin = await as("erin");
  const question = `${E2E_TAG} May I paint my door teal? ${short()}`;

  await admin.goto("/admin/ccrs/new");
  await admin.fill("#question", question);
  await admin.fill("#shortAnswer", "Yes.");
  await admin.fill("#sectionRef", "Appendix B");
  await admin.fill("#answer", "Teal is on the approved palette.");
  await save(admin, "button[value='publish']");
  await expect(admin).toHaveURL(/saved=published/);
  const id = idFrom(admin);

  await erin.goto("/ccrs");
  await expect(erin.locator(".ccr-card .q")).toContainText(question);
  await erin.goto("/");
  await expect(erin.locator("#ccr .q")).toContainText(question);

  await admin.goto(`/admin/ccrs/${id}`);
  await deleteItem(admin);
  await erin.goto("/ccrs");
  await expect(erin.locator(".ccr-card .q", { hasText: question })).toHaveCount(0);
});

test("residents: create, reset password, suspend, restore, promote, remove", async ({ as, browser, baseURL }) => {
  const admin = await as("admin");
  const email = `e2e-new-${short()}@e2e.test`;

  await admin.goto("/admin/residents/new");
  await admin.fill("#name", "E2E Newcomer");
  await admin.fill("#email", email);
  await admin.click("button[type='submit']");
  const firstPassword = (await admin.locator(".issued-password").textContent())!.trim();
  expect(firstPassword).toMatch(/^[A-Za-z0-9]{14}$/);

  // Duplicate email is refused.
  await admin.goto("/admin/residents/new");
  await admin.fill("#name", "Dup");
  await admin.fill("#email", email);
  await admin.click("button[type='submit']");
  await expect(admin.locator(".auth-error")).toContainText("already has an account");

  const fresh = await (await browser.newContext({ baseURL })).newPage();
  expect(await signInViaForm(fresh, email, firstPassword)).toBe("ok");

  await admin.goto("/admin/residents");
  await admin.locator(".thread-row", { hasText: email }).click();
  const userId = idFrom(admin);
  await admin.locator("button", { hasText: "Reset Password" }).click();
  const secondPassword = (await admin.locator(".issued-password").textContent())!.trim();
  expect(secondPassword).not.toBe(firstPassword);
  // The reset signs them out everywhere.
  await fresh.goto("/news");
  await expect(fresh.locator(".gate-cta")).toBeVisible();
  expect(await signInViaForm(fresh, email, firstPassword)).not.toBe("ok");
  expect(await signInViaForm(fresh, email, secondPassword)).toBe("ok");

  await admin.goto(`/admin/residents/${userId}`);
  await save(admin, "button:has-text('Suspend')");
  await expect(admin.locator(".save-note")).toContainText("suspended");
  await fresh.context().clearCookies();
  expect(await signInViaForm(fresh, email, secondPassword)).not.toBe("ok");

  await save(admin, "button:has-text('Restore Access')");
  await expect(admin.locator(".save-note")).toContainText("restored");
  expect(await signInViaForm(fresh, email, secondPassword)).toBe("ok");

  await admin.locator("input[name='role'][value='admin']").check();
  await save(admin, "form.editor-form button[type='submit']");
  await expect(admin.locator(".save-note")).toHaveText("Saved.");
  await fresh.goto("/admin");
  await expect(fresh.locator("h1")).toHaveText("Site Management");

  await admin.locator(".danger-zone input[name='confirm']").check();
  await admin.locator(".danger-zone .btn-danger").click();
  await expect(admin).toHaveURL(/removed=1/);
  await expect(admin.locator(".thread-row", { hasText: email })).toHaveCount(0);
  await fresh.context().clearCookies();
  expect(await signInViaForm(fresh, email, secondPassword)).not.toBe("ok");
  await fresh.context().close();
});

test("admins cannot lock themselves out", async ({ as }) => {
  const admin = await as("admin");
  await admin.goto("/admin/residents");
  await admin.locator(".thread-row", { hasText: users().admin.email }).click();
  await expect(admin.locator("button", { hasText: "Suspend" })).toHaveCount(0);
  await expect(admin.locator(".danger-zone")).toHaveCount(0);
  await expect(admin.locator("input[name='role'][value='resident']")).toBeDisabled();
});

test("site settings: words and photos change the public site", async ({ as, browser, baseURL }) => {
  const admin = await as("admin");
  const visitor = await (await browser.newContext({ baseURL })).newPage();
  const headline = `${E2E_TAG} Headline ${short()}`;

  await admin.goto("/admin/site");
  const original = await admin.inputValue("#heroHeadline");
  await admin.fill("#heroHeadline", headline);
  await admin.fill("#bannerText", `${E2E_TAG} banner`);
  await admin.setInputFiles("#heroImage", "e2e/fixtures/photo.jpg");
  await save(admin, ".settings-save button");
  await expect(admin.locator(".save-note")).toBeVisible();

  await visitor.goto("/");
  await expect(visitor.locator(".hero h1")).toHaveText(headline);
  await expect(visitor.locator(".alpha-bar")).toHaveText(`${E2E_TAG} banner`);
  const hero = visitor.locator(".hero-img");
  await expect(hero).toHaveAttribute("src", /\/api\/photos\/site\//);
  // The uploaded photo is public: a signed-out visitor can load it.
  await expectImageLoaded(hero);

  await admin.goto("/admin/site");
  await admin.fill("#heroHeadline", original);
  await admin.fill("#bannerText", "");
  await admin.locator("input[name='heroImageRemove']").check();
  await save(admin, ".settings-save button");
  await visitor.goto("/");
  await expect(visitor.locator(".hero h1")).toHaveText(original);
  await expect(visitor.locator(".alpha-bar")).toHaveCount(0);
  await expect(visitor.locator(".hero-img")).toHaveAttribute("src", /gate-sunset/);
  await visitor.context().close();
});

test("links typed into a story become safe, clickable links", async ({ as }) => {
  const admin = await as("admin");
  const erin = await as("erin");
  await admin.goto("/admin/news/new");
  await admin.fill("#title", `${E2E_TAG} Links ${short()}`);
  await admin.fill(
    "#body",
    "Questions? Write to board@e2e.test or see www.example.org/faq.\n\n" +
      "Read [the minutes](https://example.org/minutes) and [this](javascript:alert(1))."
  );
  await save(admin, "button[value='publish']");
  await expect(admin).toHaveURL(/saved=published/);
  const id = idFrom(admin);

  await erin.goto(`/news/${id}`);
  const body = erin.locator(".article-body");
  await expect(body.locator("a[href='mailto:board@e2e.test']")).toHaveText("board@e2e.test");
  // Trailing punctuation stays out of the link.
  const site = body.locator("a[href='https://www.example.org/faq']");
  await expect(site).toHaveText("www.example.org/faq");
  await expect(site).toHaveAttribute("target", "_blank");
  await expect(body.getByRole("link", { name: "the minutes" })).toHaveAttribute("href", "https://example.org/minutes");
  // Unsafe link targets are left as plain text.
  await expect(body.locator("a[href^='javascript']")).toHaveCount(0);
  await expect(body).toContainText("[this](javascript:alert(1))");

  await admin.goto(`/admin/news/${id}`);
  await deleteItem(admin);
});

test("resident links: newsletter PDF or link, and the portal button", async ({ as, browser, baseURL }) => {
  const admin = await as("admin");
  const erin = await as("erin");

  // A bad address is refused and nothing is saved.
  await admin.goto("/admin/site");
  await admin.fill("#portalUrl", "not a link");
  await save(admin, ".settings-save button");
  await expect(admin.locator(".auth-error")).toContainText("isn't a web address");

  await admin.goto("/admin/site");
  await admin.fill("#portalUrl", "www.example.org/portal");
  await admin.fill("#newsletterUrl", "https://example.org/newsletter");
  await save(admin, ".settings-save button");
  await expect(admin.locator("#portalUrl")).toHaveValue("https://www.example.org/portal");

  await erin.goto("/");
  await expect(erin.locator(".hero-actions a", { hasText: "GUD Portal" })).toHaveAttribute("href", "https://www.example.org/portal");
  await expect(erin.locator(".hero-actions a", { hasText: "Latest Newsletter" })).toHaveAttribute("href", "https://example.org/newsletter");
  await erin.goto("/news");
  await expect(erin.locator(".page-actions a")).toHaveAttribute("href", "https://example.org/newsletter");

  // An uploaded PDF takes priority, and only residents can open it.
  await admin.goto("/admin/site");
  await admin.setInputFiles("#newsletterFile", { name: "newsletter.pdf", mimeType: "application/pdf", buffer: TINY_PDF });
  await save(admin, ".settings-save button");
  await erin.goto("/news");
  const href = await erin.locator(".page-actions a").getAttribute("href");
  expect(href).toMatch(/^\/api\/photos\/documents\//);
  const pdf = await erin.request.get(href!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  const visitor = await browser.newContext({ baseURL });
  expect((await visitor.request.get(href!)).status()).toBe(401);
  await visitor.close();

  // Clearing everything hides the buttons again.
  await admin.goto("/admin/site");
  await admin.locator("input[name='newsletterFileRemove']").check();
  await admin.fill("#portalUrl", "");
  await admin.fill("#newsletterUrl", "");
  await save(admin, ".settings-save button");
  await erin.goto("/");
  await expect(erin.locator(".hero-actions")).toHaveCount(0);
  await erin.goto("/news");
  await expect(erin.locator(".page-actions")).toHaveCount(0);
});

test("forum moderation: hidden topics disappear for residents", async ({ as }) => {
  const erin = await as("erin");
  const admin = await as("admin");
  const title = `${E2E_TAG} Moderate me ${short()}`;
  await erin.goto("/community");
  await erin.locator(".new-topic summary").click();
  await erin.fill("#title", title);
  await erin.fill(".new-topic textarea", "Something regrettable.");
  await erin.click(".new-topic button[type='submit']");
  await erin.waitForURL(/\/community\/[0-9a-f-]{36}$/);
  const url = erin.url();

  await admin.goto(url);
  await save(admin, ".thread-post button:has-text('Hide')");
  await expect(admin.locator(".thread-post .pill")).toHaveText("Hidden");
  expect((await erin.goto(url))?.status()).toBe(404);
  await erin.goto("/community");
  await expect(erin.locator(".thread-title", { hasText: title })).toHaveCount(0);

  await save(admin, ".thread-post button:has-text('Unhide')");
  await erin.goto(url);
  await expect(erin.locator("h1")).toContainText(title);
});
