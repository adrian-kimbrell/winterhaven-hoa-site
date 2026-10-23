import { execFileSync } from "child_process";
import { request } from "@playwright/test";
import {
  type Role,
  type TestUser,
  purgeTestData,
  saveUsers,
  snapshotSettings,
  statePath,
} from "./data";

const BASE = "http://localhost:3000";

/* Signs in over HTTP and saves the cookies for tests to reuse. The
   sign-in endpoint allows 3 attempts per 10 s (one shared bucket on a
   local server), so this waits out 429s. */
export async function signInState(user: TestUser, path: string) {
  const ip = `10.250.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
  const ctx = await request.newContext({
    baseURL: BASE,
    extraHTTPHeaders: { Origin: BASE, "x-forwarded-for": ip },
  });
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await ctx.post("/api/auth/sign-in/email", {
      data: { email: user.email, password: user.password },
    });
    if (res.ok()) {
      await ctx.storageState({ path });
      await ctx.dispose();
      return;
    }
    if (res.status() !== 429) {
      throw new Error(`Sign-in failed for ${user.email}: ${res.status()} ${await res.text()}`);
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error(`Sign-in for ${user.email} stayed rate limited`);
}

export default async function globalSetup() {
  await purgeTestData();
  await snapshotSettings();

  const out = execFileSync("npx", ["tsx", "e2e/support/create-users.ts"], {
    encoding: "utf8",
  });
  const users = JSON.parse(out) as Record<Role, TestUser>;
  saveUsers(users);

  for (const role of ["admin", "alice", "bob", "carol", "dave", "erin"] as const) {
    await signInState(users[role], statePath(role));
  }
}
