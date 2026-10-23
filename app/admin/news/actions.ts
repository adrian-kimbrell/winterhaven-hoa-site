"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, ne } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { newsStory } from "@/lib/schema";
import { field, optional, publishState, required } from "@/lib/content";
import { discardBlob, storeUpload } from "@/lib/uploads";

function revalidateNews(id: string) {
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath(`/news/${id}`);
  revalidatePath("/admin/news");
}

export async function saveStory(id: string | null, formData: FormData) {
  const session = await requireAdmin();
  const back = `/admin/news/${id ?? "new"}`;

  const title = required(160).safeParse(field(formData, "title"));
  if (!title.success) redirect(`${back}?error=title`);

  const existing = id
    ? await db.query.newsStory.findFirst({ where: eq(newsStory.id, id) })
    : null;
  if (id && !existing) redirect("/admin/news");

  const image = await storeUpload(formData.get("image"), "news");
  if (image === "invalid") redirect(`${back}?error=photo`);
  const removeImage = formData.get("imageRemove") === "on";
  if (image || removeImage) await discardBlob(existing?.imageKey);

  const state = publishState(formData, existing);
  const values = {
    title: title.data,
    kicker: optional(formData, "kicker", 60),
    summary: optional(formData, "summary", 400),
    body: field(formData, "body").slice(0, 20000),
    imageKey: image ?? (removeImage ? null : (existing?.imageKey ?? null)),
    imageAlt: optional(formData, "imageAlt", 200),
    pinned: formData.get("pinned") === "on",
    ...state,
    updatedAt: new Date(),
  };

  const storyId = id ?? randomUUID();
  if (existing) {
    await db.update(newsStory).set(values).where(eq(newsStory.id, storyId));
  } else {
    await db
      .insert(newsStory)
      .values({ id: storyId, authorId: session.user.id, ...values });
  }
  // Only one lead story at a time.
  if (values.pinned) {
    await db.update(newsStory).set({ pinned: false }).where(ne(newsStory.id, storyId));
  }
  revalidateNews(storyId);
  redirect(`/admin/news/${storyId}?saved=${state.status}`);
}

export async function deleteStory(id: string, formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "on") redirect(`/admin/news/${id}`);
  const row = await db.query.newsStory.findFirst({ where: eq(newsStory.id, id) });
  if (row) {
    await db.delete(newsStory).where(eq(newsStory.id, id));
    await discardBlob(row.imageKey);
  }
  revalidateNews(id);
  redirect("/admin/news?deleted=1");
}
