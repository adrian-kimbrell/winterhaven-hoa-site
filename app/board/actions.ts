"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comment } from "@/lib/schema";

const COOLDOWN_MS = 30_000;
const bodySchema = z.string().trim().min(1).max(2000);

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function postComment(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const raw = formData.get("body");
  if (typeof raw !== "string") redirect("/board?error=empty");
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    redirect(raw.trim().length === 0 ? "/board?error=empty" : "/board?error=toolong");
  }

  // Application-level cooldown: the auth rate limiter only covers
  // /api/auth, not server actions.
  const recent = await db.query.comment.findFirst({
    where: and(
      eq(comment.userId, session.user.id),
      gt(comment.createdAt, new Date(Date.now() - COOLDOWN_MS))
    ),
  });
  if (recent) redirect("/board?error=cooldown");

  await db.insert(comment).values({
    id: randomUUID(),
    userId: session.user.id,
    body: parsed.data,
    targetType: "board",
  });
  revalidatePath("/board");
  redirect("/board");
}

export async function deleteOwnComment(id: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  // Authorization lives in the WHERE clause: only the author's own row
  // can match.
  await db
    .delete(comment)
    .where(and(eq(comment.id, id), eq(comment.userId, session.user.id)));
  revalidatePath("/board");
}

export async function setCommentHidden(id: string, hidden: boolean) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") redirect("/login");
  await db
    .update(comment)
    .set(
      hidden
        ? { status: "hidden", hiddenById: session.user.id, hiddenAt: new Date() }
        : { status: "visible", hiddenById: null, hiddenAt: null }
    )
    .where(eq(comment.id, id));
  revalidatePath("/board");
}
