"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, count, eq, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comment, thread } from "@/lib/schema";

const THREAD_COOLDOWN_MS = 60_000;
const REPLY_COOLDOWN_MS = 30_000;

const titleSchema = z.string().trim().min(1).max(120);
const threadBodySchema = z.string().trim().min(1).max(5000);
const replyBodySchema = z.string().trim().min(1).max(2000);

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function createThread(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const title = titleSchema.safeParse(field(formData, "title"));
  const body = threadBodySchema.safeParse(field(formData, "body"));
  if (!title.success) {
    redirect(
      field(formData, "title").trim() === ""
        ? "/board?error=title-empty"
        : "/board?error=title-toolong"
    );
  }
  if (!body.success) {
    redirect(
      field(formData, "body").trim() === ""
        ? "/board?error=body-empty"
        : "/board?error=body-toolong"
    );
  }

  const recent = await db.query.thread.findFirst({
    where: and(
      eq(thread.userId, session.user.id),
      gt(thread.createdAt, new Date(Date.now() - THREAD_COOLDOWN_MS))
    ),
  });
  if (recent) redirect("/board?error=cooldown");

  const id = randomUUID();
  await db.insert(thread).values({
    id,
    userId: session.user.id,
    title: title.data,
    body: body.data,
  });
  revalidatePath("/board");
  revalidatePath("/");
  redirect(`/board/${id}`);
}

export async function createReply(threadId: string, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const isAdmin = session.user.role === "admin";

  const target = await db.query.thread.findFirst({
    where: eq(thread.id, threadId),
  });
  if (!target || (target.status === "hidden" && !isAdmin)) redirect("/board");

  const back = `/board/${threadId}`;
  const raw = field(formData, "body");
  const parsed = replyBodySchema.safeParse(raw);
  if (!parsed.success) {
    redirect(raw.trim() === "" ? `${back}?error=body-empty` : `${back}?error=body-toolong`);
  }

  const recent = await db.query.comment.findFirst({
    where: and(
      eq(comment.userId, session.user.id),
      gt(comment.createdAt, new Date(Date.now() - REPLY_COOLDOWN_MS))
    ),
  });
  if (recent) redirect(`${back}?error=cooldown`);

  await db.insert(comment).values({
    id: randomUUID(),
    userId: session.user.id,
    body: parsed.data,
    targetType: "thread",
    targetId: threadId,
  });
  await db
    .update(thread)
    .set({ lastReplyAt: new Date() })
    .where(eq(thread.id, threadId));
  revalidatePath("/board");
  revalidatePath(back);
  revalidatePath("/");
  redirect(back);
}

/* Authors may delete their own topic only while it has no replies;
   after that the conversation belongs to everyone (admins can hide). */
export async function deleteOwnThread(id: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [replies] = await db
    .select({ n: count() })
    .from(comment)
    .where(and(eq(comment.targetType, "thread"), eq(comment.targetId, id)));
  if (replies.n === 0) {
    await db
      .delete(thread)
      .where(and(eq(thread.id, id), eq(thread.userId, session.user.id)));
  }
  revalidatePath("/board");
  revalidatePath("/");
  redirect("/board");
}

export async function deleteOwnReply(id: string, threadId: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  await db
    .delete(comment)
    .where(and(eq(comment.id, id), eq(comment.userId, session.user.id)));
  revalidatePath(`/board/${threadId}`);
  revalidatePath("/board");
}

export async function setThreadHidden(id: string, hidden: boolean) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") redirect("/login");
  await db
    .update(thread)
    .set(
      hidden
        ? { status: "hidden", hiddenById: session.user.id, hiddenAt: new Date() }
        : { status: "visible", hiddenById: null, hiddenAt: null }
    )
    .where(eq(thread.id, id));
  revalidatePath("/board");
  revalidatePath(`/board/${id}`);
  revalidatePath("/");
}

export async function setReplyHidden(
  id: string,
  threadId: string,
  hidden: boolean
) {
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
  revalidatePath(`/board/${threadId}`);
}
