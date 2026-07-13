import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import * as schema from "./schema";

export const auth = betterAuth({
  appName: "Winterhaven Village",
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // Invite-only community: accounts are created by admins, never by
    // open signup.
    disableSignUp: true,
    minPasswordLength: 10,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "rateLimit",
  },
  plugins: [admin({ defaultRole: "resident" }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
