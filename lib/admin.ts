import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/* One session lookup per request, however many server components ask
   (the admin layout and page both do). */
const currentSession = cache(async () =>
  auth.api.getSession({ headers: await headers() })
);

/* Every admin page and server action calls this — the /admin layout
   check alone does not protect server actions, which are reachable
   by direct POST. */
export async function requireAdmin() {
  const session = await currentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/");
  return session;
}
