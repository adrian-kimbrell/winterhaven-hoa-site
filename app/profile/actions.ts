"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { del, put } from "@vercel/blob";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pet, profile } from "@/lib/schema";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const shortText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s === "" ? null : s));

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/* Admins may edit any resident's profile (many residents will want
   help); everyone else edits only their own. */
function resolveTarget(
  session: { user: { id: string; role?: string | null } },
  formData: FormData
) {
  const requested = formData.get("for");
  if (
    typeof requested === "string" &&
    requested !== "" &&
    session.user.role === "admin"
  ) {
    return requested;
  }
  return session.user.id;
}

function backUrl(sessionUserId: string, targetId: string) {
  return targetId === sessionUserId ? "/profile" : `/profile?for=${targetId}`;
}

function withParam(base: string, param: string) {
  return base + (base.includes("?") ? "&" : "?") + param;
}

async function storePhoto(
  value: FormDataEntryValue | null,
  prefix: string
): Promise<string | null | "invalid"> {
  if (!(value instanceof File) || value.size === 0) return null;
  const ext = IMAGE_TYPES[value.type];
  if (!ext || value.size > MAX_PHOTO_BYTES) return "invalid";
  const blob = await put(`${prefix}/${randomUUID()}.${ext}`, value, {
    access: "private",
    addRandomSuffix: false,
  });
  return blob.pathname;
}

async function discardBlob(pathname: string | null | undefined) {
  if (!pathname) return;
  try {
    await del(pathname);
  } catch {
    /* best effort — an orphaned blob is not worth failing the save */
  }
}

function revalidateDirectory(userId: string) {
  revalidatePath("/directory");
  revalidatePath(`/directory/${userId}`);
  revalidatePath("/");
}

export async function saveProfile(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const uid = resolveTarget(session, formData);
  const back = backUrl(session.user.id, uid);

  const parsed = z
    .object({
      unit: shortText(80),
      phone: shortText(40),
      bio: shortText(2000),
      facts: shortText(2000),
    })
    .safeParse({
      unit: formData.get("unit") ?? "",
      phone: formData.get("phone") ?? "",
      bio: formData.get("bio") ?? "",
      facts: formData.get("facts") ?? "",
    });
  if (!parsed.success) redirect(withParam(back, "error=length"));
  const optIn = formData.get("optIn") === "on";

  const photo = await storePhoto(formData.get("photo"), `profiles/${uid}`);
  const residence = await storePhoto(
    formData.get("residencePhoto"),
    `residences/${uid}`
  );
  if (photo === "invalid" || residence === "invalid") {
    redirect(withParam(back, "error=photo"));
  }

  const existing = await db.query.profile.findFirst({
    where: eq(profile.userId, uid),
  });
  if (photo) await discardBlob(existing?.photoKey);
  if (residence) await discardBlob(existing?.residencePhotoKey);

  const values = {
    optIn,
    ...parsed.data,
    photoKey: photo ?? existing?.photoKey ?? null,
    residencePhotoKey: residence ?? existing?.residencePhotoKey ?? null,
    updatedAt: new Date(),
  };
  await db
    .insert(profile)
    .values({ userId: uid, ...values })
    .onConflictDoUpdate({ target: profile.userId, set: values });

  revalidateDirectory(uid);
  revalidatePath(back);
  redirect(withParam(back, "saved=1"));
}

export async function addPet(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const uid = resolveTarget(session, formData);
  const back = backUrl(session.user.id, uid);

  const name = z.string().trim().min(1).max(60).safeParse(formData.get("name"));
  const species = shortText(60).safeParse(formData.get("species") ?? "");
  if (!name.success || !species.success) {
    redirect(withParam(back, "error=pet-name"));
  }
  const photo = await storePhoto(formData.get("photo"), `pets/${uid}`);
  if (photo === "invalid") redirect(withParam(back, "error=photo"));

  await db.insert(pet).values({
    id: randomUUID(),
    userId: uid,
    name: name.data,
    species: species.data,
    photoKey: photo,
  });
  revalidateDirectory(uid);
  revalidatePath(back);
  redirect(back);
}

export async function deletePet(petId: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const row = await db.query.pet.findFirst({ where: eq(pet.id, petId) });
  if (!row) redirect("/profile");
  const allowed =
    row.userId === session.user.id || session.user.role === "admin";
  if (!allowed) redirect("/profile");

  await db.delete(pet).where(eq(pet.id, petId));
  await discardBlob(row.photoKey);

  const back = backUrl(session.user.id, row.userId);
  revalidateDirectory(row.userId);
  revalidatePath(back);
  redirect(back);
}
