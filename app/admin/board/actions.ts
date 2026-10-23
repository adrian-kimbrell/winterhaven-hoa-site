"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { boardMember, boardPost } from "@/lib/schema";
import { field, optional, publishState, required } from "@/lib/content";
import { discardBlob, storeUpload } from "@/lib/uploads";

function revalidateBoard() {
  revalidatePath("/");
  revalidatePath("/board");
  revalidatePath("/admin/board");
}

export async function saveBoardPost(id: string | null, formData: FormData) {
  const session = await requireAdmin();
  const back = `/admin/board/posts/${id ?? "new"}`;

  const title = required(160).safeParse(field(formData, "title"));
  if (!title.success) redirect(`${back}?error=title`);

  const existing = id
    ? await db.query.boardPost.findFirst({ where: eq(boardPost.id, id) })
    : null;
  if (id && !existing) redirect("/admin/board");

  const upload = formData.get("document");
  const doc = await storeUpload(upload, "board", "document");
  if (doc === "invalid") redirect(`${back}?error=document`);
  const removeDoc = formData.get("documentRemove") === "on";
  if (doc || removeDoc) await discardBlob(existing?.documentKey);

  const state = publishState(formData, existing);
  const values = {
    kind: formData.get("kind") === "minutes" ? "minutes" : "update",
    title: title.data,
    body: field(formData, "body").slice(0, 20000),
    meetingDate: optional(formData, "meetingDate", 10),
    documentKey: doc ?? (removeDoc ? null : (existing?.documentKey ?? null)),
    documentName: doc
      ? (upload as File).name.slice(0, 200)
      : removeDoc
        ? null
        : (existing?.documentName ?? null),
    ...state,
    updatedAt: new Date(),
  };

  const postId = id ?? randomUUID();
  if (existing) {
    await db.update(boardPost).set(values).where(eq(boardPost.id, postId));
  } else {
    await db
      .insert(boardPost)
      .values({ id: postId, authorId: session.user.id, ...values });
  }
  revalidateBoard();
  redirect(`/admin/board/posts/${postId}?saved=${state.status}`);
}

export async function deleteBoardPost(id: string, formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "on") redirect(`/admin/board/posts/${id}`);
  const row = await db.query.boardPost.findFirst({ where: eq(boardPost.id, id) });
  if (row) {
    await db.delete(boardPost).where(eq(boardPost.id, id));
    await discardBlob(row.documentKey);
  }
  revalidateBoard();
  redirect("/admin/board?deleted=post");
}

export async function saveBoardMember(id: string | null, formData: FormData) {
  await requireAdmin();
  const back = `/admin/board/members/${id ?? "new"}`;

  const name = required(120).safeParse(field(formData, "name"));
  if (!name.success) redirect(`${back}?error=name`);

  const existing = id
    ? await db.query.boardMember.findFirst({ where: eq(boardMember.id, id) })
    : null;
  if (id && !existing) redirect("/admin/board");

  const photo = await storeUpload(formData.get("photo"), "board-members");
  if (photo === "invalid") redirect(`${back}?error=photo`);
  const removePhoto = formData.get("photoRemove") === "on";
  if (photo || removePhoto) await discardBlob(existing?.photoKey);

  const order = Number.parseInt(field(formData, "sortOrder"), 10);
  const values = {
    name: name.data,
    position: optional(formData, "position", 80),
    email: optional(formData, "email", 200),
    phone: optional(formData, "phone", 40),
    bio: optional(formData, "bio", 4000),
    photoKey: photo ?? (removePhoto ? null : (existing?.photoKey ?? null)),
    sortOrder: Number.isFinite(order) ? order : 0,
    updatedAt: new Date(),
  };

  const memberId = id ?? randomUUID();
  if (existing) {
    await db.update(boardMember).set(values).where(eq(boardMember.id, memberId));
  } else {
    await db.insert(boardMember).values({ id: memberId, ...values });
  }
  revalidateBoard();
  redirect(`/admin/board/members/${memberId}?saved=1`);
}

export async function deleteBoardMember(id: string, formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "on") redirect(`/admin/board/members/${id}`);
  const row = await db.query.boardMember.findFirst({ where: eq(boardMember.id, id) });
  if (row) {
    await db.delete(boardMember).where(eq(boardMember.id, id));
    await discardBlob(row.photoKey);
  }
  revalidateBoard();
  redirect("/admin/board?deleted=member");
}
