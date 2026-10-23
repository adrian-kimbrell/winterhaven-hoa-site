import { test, expect, users, signInViaForm } from "./support/fixtures";

test.describe.configure({ mode: "serial" });

test("sign-in works when the browser autofills the form", async ({ page, pageErrors }) => {
  const u = users().carol;
  await page.goto("/login");
  // Autofill sets values without input events.
  await page.evaluate(
    ([e, p]) => {
      (document.querySelector("#email") as HTMLInputElement).value = e;
      (document.querySelector("#password") as HTMLInputElement).value = p;
    },
    [u.email, u.password]
  );
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/");
  await expect(page.locator(".hero h1")).toHaveText(/Welcome home, E2E\./);
  void pageErrors;
});

test("sign out returns to the public homepage", async ({ page, pageErrors }) => {
  const u = users().carol;
  expect(await signInViaForm(page, u.email, u.password)).toBe("ok");
  await page.locator(".hero-nav .nav-link-btn", { hasText: "Sign Out" }).click();
  await expect(page.locator(".hero-actions a", { hasText: "Resident Sign In" })).toBeVisible();
  await page.goto("/news");
  await expect(page.locator(".gate-cta")).toBeVisible();
  void pageErrors;
});

test("residents are kept out of admin", async ({ as }) => {
  const page = await as("alice");
  for (const path of ["/admin", "/admin/news/new", "/admin/residents", "/admin/site"]) {
    await page.goto(path);
    await expect(page).toHaveURL("/");
  }
  await page.goto("/");
  await expect(page.locator(".hero-nav a", { hasText: "Admin" })).toHaveCount(0);
});

test("residents can change their password", async ({ as, page }) => {
  const dave = users().dave;
  const resident = await as("dave");
  const next = `${dave.password}-new`;
  await resident.goto("/profile#password");
  await resident.fill("#currentPassword", "wrong-current-password");
  await resident.fill("#newPassword", next);
  await resident.fill("#confirmPassword", next);
  await resident.click('#password button[type="submit"]');
  await expect(resident.locator("#password .auth-error")).toContainText("wasn't right");

  await resident.fill("#currentPassword", dave.password);
  await resident.fill("#newPassword", next);
  await resident.fill("#confirmPassword", `${next}x`);
  await resident.click('#password button[type="submit"]');
  await expect(resident.locator("#password .auth-error")).toContainText("don't match");

  await resident.fill("#currentPassword", dave.password);
  await resident.fill("#newPassword", next);
  await resident.fill("#confirmPassword", next);
  await resident.click('#password button[type="submit"]');
  await expect(resident.locator("#password .save-note")).toContainText("Password changed");

  expect(await signInViaForm(page, dave.email, dave.password)).not.toBe("ok");
  expect(await signInViaForm(page, dave.email, next)).toBe("ok");
});
