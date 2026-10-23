"use server";

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profile, user } from "@/lib/schema";
import { field } from "@/lib/content";
import { discardBlob } from "@/lib/uploads";

export type PasswordResult =
  | { ok: true; email: string; password: string; userId: string }
  | { ok: false; error: string }
  | null;

/* Easy to read aloud or copy into an email: no lookalike characters. */
function temporaryPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(14);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function apiMessage(e: unknown, fallback: string) {
  const msg = (e as { body?: { message?: string } })?.body?.message;
  return msg ?? fallback;
}

export async function createResident(
  _prev: PasswordResult,
  formData: FormData
): Promise<PasswordResult> {
  await requireAdmin();
  const name = z.string().trim().min(1).max(120).safeParse(field(formData, "name"));
  const email = z.email().max(200).safeParse(field(formData, "email").toLowerCase());
  if (!name.success) return { ok: false, error: "Enter the resident's name." };
  if (!email.success) return { ok: false, error: "Enter a valid email address." };
  const role = formData.get("role") === "admin" ? "admin" : "resident";

  const existing = await db.query.user.findFirst({ where: eq(user.email, email.data) });
  if (existing) return { ok: false, error: `${email.data} already has an account.` };

  const password = temporaryPassword();
  try {
    const created = await auth.api.createUser({
      body: { email: email.data, password, name: name.data, role: role as "admin" },
      headers: await headers(),
    });
    await db.update(user).set({ emailVerified: true }).where(eq(user.id, created.user.id));
    revalidatePath("/admin/residents");
    return { ok: true, email: email.data, password, userId: created.user.id };
  } catch (e) {
    return { ok: false, error: apiMessage(e, "Could not create the account.") };
  }
}

export async function resetPassword(
  userId: string,
  _prev: PasswordResult,
  _formData: FormData
): Promise<PasswordResult> {
  await requireAdmin();
  const target = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!target) return { ok: false, error: "That account no longer exists." };
  const password = temporaryPassword();
  try {
    const h = await headers();
    await auth.api.setUserPassword({ body: { userId, newPassword: password }, headers: h });
    // Sign them out everywhere so the old password stops working at once.
    await auth.api.revokeUserSessions({ body: { userId }, headers: h });
    return { ok: true, email: target.email, password, userId };
  } catch (e) {
    return { ok: false, error: apiMessage(e, "Could not reset the password.") };
  }
}

function back(userId: string, param: string) {
  return `/admin/residents/${userId}?${param}`;
}

export async function updateResident(userId: string, formData: FormData) {
  const session = await requireAdmin();
  const name = z.string().trim().min(1).max(120).safeParse(field(formData, "name"));
  const email = z.email().max(200).safeParse(field(formData, "email").toLowerCase());
  if (!name.success || !email.success) redirect(back(userId, "error=details"));

  const clash = await db.query.user.findFirst({ where: eq(user.email, email.data) });
  if (clash && clash.id !== userId) redirect(back(userId, "error=email-taken"));

  const role = formData.get("role") === "admin" ? "admin" : "resident";
  // An admin cannot demote themselves — avoids locking everyone out.
  if (userId === session.user.id && role !== "admin") {
    redirect(back(userId, "error=self-demote"));
  }

  await db
    .update(user)
    .set({ name: name.data, email: email.data, role, updatedAt: new Date() })
    .where(eq(user.id, userId));
  revalidatePath("/admin/residents");
  revalidatePath("/directory");
  redirect(back(userId, "saved=1"));
}

export async function setSuspended(userId: string, suspend: boolean) {
  const session = await requireAdmin();
  if (userId === session.user.id) redirect(back(userId, "error=self"));
  const h = await headers();
  if (suspend) {
    await auth.api.banUser({
      body: { userId, banReason: "Suspended by an administrator" },
      headers: h,
    });
  } else {
    await auth.api.unbanUser({ body: { userId }, headers: h });
  }
  revalidatePath("/admin/residents");
  redirect(back(userId, suspend ? "saved=suspended" : "saved=restored"));
}

export async function removeResident(userId: string, formData: FormData) {
  const session = await requireAdmin();
  if (userId === session.user.id) redirect(back(userId, "error=self"));
  if (formData.get("confirm") !== "on") redirect(back(userId, "error=confirm"));

  const prof = await db.query.profile.findFirst({
    where: eq(profile.userId, userId),
    with: { pets: true },
  });
  await auth.api.removeUser({ body: { userId }, headers: await headers() });
  // Rows cascade with the user; the photos live in blob storage.
  await discardBlob(prof?.photoKey);
  await discardBlob(prof?.residencePhotoKey);
  for (const p of prof?.pets ?? []) await discardBlob(p.photoKey);

  revalidatePath("/admin/residents");
  revalidatePath("/directory");
  revalidatePath("/");
  redirect("/admin/residents?removed=1");
}
