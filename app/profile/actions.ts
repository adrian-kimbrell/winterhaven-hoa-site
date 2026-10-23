"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pet, profile, user } from "@/lib/schema";
import { discardBlob, storeUpload as storePhoto } from "@/lib/uploads";
import { geocodeAddress } from "@/lib/geocode";

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

function revalidateDirectory(userId: string) {
  revalidatePath("/directory");
  revalidatePath("/admin/residents");
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
      name: z.string().trim().min(1).max(80),
      unit: shortText(80),
      phone: shortText(40),
      bio: shortText(2000),
      facts: shortText(2000),
    })
    .safeParse({
      name: formData.get("name") ?? "",
      unit: formData.get("unit") ?? "",
      phone: formData.get("phone") ?? "",
      bio: formData.get("bio") ?? "",
      facts: formData.get("facts") ?? "",
    });
  if (!parsed.success) {
    const nameMissing = parsed.error.issues.some(
      (i) => i.path[0] === "name" && i.code === "too_small"
    );
    redirect(withParam(back, nameMissing ? "error=name" : "error=length"));
  }
  const { name, ...details } = parsed.data;
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

  // Geocode only when the address changes (or never resolved before).
  let coordinates = {
    latitude: existing?.latitude ?? null,
    longitude: existing?.longitude ?? null,
  };
  if (!details.unit) {
    coordinates = { latitude: null, longitude: null };
  } else if (details.unit !== existing?.unit || existing?.latitude == null) {
    coordinates = (await geocodeAddress(details.unit)) ?? {
      latitude: null,
      longitude: null,
    };
  }

  const values = {
    optIn,
    ...details,
    ...coordinates,
    photoKey: photo ?? existing?.photoKey ?? null,
    residencePhotoKey: residence ?? existing?.residencePhotoKey ?? null,
    updatedAt: new Date(),
  };
  await db
    .insert(profile)
    .values({ userId: uid, ...values })
    .onConflictDoUpdate({ target: profile.userId, set: values });
  await db
    .update(user)
    .set({ name, updatedAt: new Date() })
    .where(eq(user.id, uid));

  revalidateDirectory(uid);
  revalidatePath(back);
  redirect(withParam(back, "saved=1"));
}

export async function changePassword(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const current = formData.get("currentPassword");
  const next = formData.get("newPassword");
  const confirm = formData.get("confirmPassword");
  if (typeof current !== "string" || typeof next !== "string" || current === "") {
    redirect("/profile?error=password-current#password");
  }
  if (next.length < 10 || next.length > 128) {
    redirect("/profile?error=password-length#password");
  }
  if (next !== confirm) redirect("/profile?error=password-match#password");

  try {
    await auth.api.changePassword({
      body: { currentPassword: current, newPassword: next, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch {
    redirect("/profile?error=password-current#password");
  }
  redirect("/profile?saved=password#password");
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
