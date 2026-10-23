"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { comment, lighterPost } from "@/lib/schema";
import { field, optional, publishState, required } from "@/lib/content";
import { discardBlob, storeUpload } from "@/lib/uploads";

function revalidateLighter(id: string) {
  revalidatePath("/");
  revalidatePath("/lighter");
  revalidatePath(`/lighter/${id}`);
  revalidatePath("/admin/lighter");
}

export async function saveLighterPost(id: string | null, formData: FormData) {
  const session = await requireAdmin();
  const back = `/admin/lighter/${id ?? "new"}`;

  const title = required(300).safeParse(field(formData, "title"));
  if (!title.success) redirect(`${back}?error=title`);

  const existing = id
    ? await db.query.lighterPost.findFirst({ where: eq(lighterPost.id, id) })
    : null;
  if (id && !existing) redirect("/admin/lighter");

  const image = await storeUpload(formData.get("image"), "lighter");
  if (image === "invalid") redirect(`${back}?error=photo`);
  const removeImage = formData.get("imageRemove") === "on";
  if (image || removeImage) await discardBlob(existing?.imageKey);

  const state = publishState(formData, existing);
  const values = {
    title: title.data,
    body: field(formData, "body").slice(0, 10000),
    note: optional(formData, "note", 160),
    imageKey: image ?? (removeImage ? null : (existing?.imageKey ?? null)),
    imageAlt: optional(formData, "imageAlt", 200),
    allowComments: formData.get("allowComments") === "on",
    ...state,
    updatedAt: new Date(),
  };

  const postId = id ?? randomUUID();
  if (existing) {
    await db.update(lighterPost).set(values).where(eq(lighterPost.id, postId));
  } else {
    await db
      .insert(lighterPost)
      .values({ id: postId, authorId: session.user.id, ...values });
  }
  revalidateLighter(postId);
  redirect(`/admin/lighter/${postId}?saved=${state.status}`);
}

export async function deleteLighterPost(id: string, formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "on") redirect(`/admin/lighter/${id}`);
  const row = await db.query.lighterPost.findFirst({ where: eq(lighterPost.id, id) });
  if (row) {
    await db
      .delete(comment)
      .where(and(eq(comment.targetType, "lighter"), eq(comment.targetId, id)));
    await db.delete(lighterPost).where(eq(lighterPost.id, id));
    await discardBlob(row.imageKey);
  }
  revalidateLighter(id);
  redirect("/admin/lighter?deleted=1");
}
