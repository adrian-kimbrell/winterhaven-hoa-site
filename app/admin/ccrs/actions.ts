"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { ccrQuestion, comment } from "@/lib/schema";
import { field, optional, publishState, required } from "@/lib/content";

function revalidateCcrs(id: string) {
  revalidatePath("/");
  revalidatePath("/ccrs");
  revalidatePath(`/ccrs/${id}`);
  revalidatePath("/admin/ccrs");
}

export async function saveQuestion(id: string | null, formData: FormData) {
  const session = await requireAdmin();
  const back = `/admin/ccrs/${id ?? "new"}`;

  const question = required(500).safeParse(field(formData, "question"));
  if (!question.success) redirect(`${back}?error=question`);

  const existing = id
    ? await db.query.ccrQuestion.findFirst({ where: eq(ccrQuestion.id, id) })
    : null;
  if (id && !existing) redirect("/admin/ccrs");

  const state = publishState(formData, existing);
  const values = {
    question: question.data,
    shortAnswer: optional(formData, "shortAnswer", 120),
    answer: field(formData, "answer").slice(0, 10000),
    sectionRef: optional(formData, "sectionRef", 120),
    ...state,
    updatedAt: new Date(),
  };

  const qid = id ?? randomUUID();
  if (existing) {
    await db.update(ccrQuestion).set(values).where(eq(ccrQuestion.id, qid));
  } else {
    await db
      .insert(ccrQuestion)
      .values({ id: qid, authorId: session.user.id, ...values });
  }
  revalidateCcrs(qid);
  redirect(`/admin/ccrs/${qid}?saved=${state.status}`);
}

export async function deleteQuestion(id: string, formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "on") redirect(`/admin/ccrs/${id}`);
  await db
    .delete(comment)
    .where(and(eq(comment.targetType, "ccr"), eq(comment.targetId, id)));
  await db.delete(ccrQuestion).where(eq(ccrQuestion.id, id));
  revalidateCcrs(id);
  redirect("/admin/ccrs?deleted=1");
}
