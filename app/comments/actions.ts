"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ccrQuestion, comment, lighterPost } from "@/lib/schema";

/* Comments on CC&R questions and Lighter Side pieces. Forum replies
   keep their own actions in app/community. */

const COOLDOWN_MS = 30_000;
const bodySchema = z.string().trim().min(1).max(2000);

export type CommentTarget = "ccr" | "lighter";

const PATHS: Record<CommentTarget, string> = {
  ccr: "/ccrs",
  lighter: "/lighter",
};

async function targetOpen(type: CommentTarget, id: string) {
  if (type === "ccr") {
    const q = await db.query.ccrQuestion.findFirst({ where: eq(ccrQuestion.id, id) });
    return q?.status === "published";
  }
  const p = await db.query.lighterPost.findFirst({ where: eq(lighterPost.id, id) });
  return p?.status === "published" && p.allowComments;
}

function revalidateTarget(type: CommentTarget, id: string) {
  revalidatePath(`${PATHS[type]}/${id}`);
  revalidatePath(PATHS[type]);
}

export async function postComment(
  type: CommentTarget,
  targetId: string,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const back = `${PATHS[type]}/${targetId}`;
  if (!(await targetOpen(type, targetId))) redirect(PATHS[type]);

  const raw = formData.get("body");
  const parsed = bodySchema.safeParse(typeof raw === "string" ? raw : "");
  if (!parsed.success) redirect(`${back}?error=body#comments`);

  const recent = await db.query.comment.findFirst({
    where: and(
      eq(comment.userId, session.user.id),
      gt(comment.createdAt, new Date(Date.now() - COOLDOWN_MS))
    ),
  });
  if (recent) redirect(`${back}?error=cooldown#comments`);

  await db.insert(comment).values({
    id: randomUUID(),
    userId: session.user.id,
    body: parsed.data,
    targetType: type,
    targetId,
  });
  revalidateTarget(type, targetId);
  redirect(`${back}#comments`);
}

/* Residents may delete their own comments, but not ones a moderator
   has hidden — the hidden record is the moderation audit trail. */
export async function deleteOwnComment(
  type: CommentTarget,
  targetId: string,
  id: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  await db
    .delete(comment)
    .where(
      and(
        eq(comment.id, id),
        eq(comment.userId, session.user.id),
        eq(comment.status, "visible")
      )
    );
  revalidateTarget(type, targetId);
  redirect(`${PATHS[type]}/${targetId}#comments`);
}

export async function setCommentHidden(
  type: CommentTarget,
  targetId: string,
  id: string,
  hidden: boolean
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/login");
  await db
    .update(comment)
    .set(
      hidden
        ? { status: "hidden", hiddenById: session.user.id, hiddenAt: new Date() }
        : { status: "visible", hiddenById: null, hiddenAt: null }
    )
    .where(eq(comment.id, id));
  revalidateTarget(type, targetId);
  redirect(`${PATHS[type]}/${targetId}#comments`);
}
