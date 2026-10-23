"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { siteSetting } from "@/lib/schema";
import { SETTINGS, SETTING_KEYS, getSettings } from "@/lib/site";
import { discardBlob, storeUpload } from "@/lib/uploads";
import { safeHref } from "@/lib/linkify";

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const current = await getSettings();
  const now = new Date();
  const rows: { key: string; value: string; updatedAt: Date }[] = [];
  const resets: string[] = [];

  // Check links before storing any upload, so a typo saves nothing.
  const links: Partial<Record<string, string>> = {};
  for (const key of SETTING_KEYS) {
    if (SETTINGS[key].kind !== "link") continue;
    const raw = formData.get(key);
    const value = typeof raw === "string" ? raw.trim() : "";
    const href = value ? safeHref(value) : "";
    if (href === null || href.startsWith("mailto:")) redirect("/admin/site?error=link");
    links[key] = href;
  }

  for (const key of SETTING_KEYS) {
    const def = SETTINGS[key];
    if (def.kind === "image") {
      const uploaded = await storeUpload(formData.get(key), "site");
      if (uploaded === "invalid") redirect("/admin/site?error=photo");
      const reset = formData.get(`${key}Remove`) === "on";
      const old = current[key];
      const oldIsBlob = !old.startsWith("/");
      if (uploaded) {
        if (oldIsBlob) await discardBlob(old);
        rows.push({ key, value: uploaded, updatedAt: now });
      } else if (reset) {
        if (oldIsBlob) await discardBlob(old);
        resets.push(key);
      }
      continue;
    }
    if (def.kind === "document") {
      const uploaded = await storeUpload(formData.get(key), "documents", "document");
      if (uploaded === "invalid") redirect("/admin/site?error=document");
      const old = current[key];
      if (uploaded) {
        await discardBlob(old);
        rows.push({ key, value: uploaded, updatedAt: now });
      } else if (formData.get(`${key}Remove`) === "on") {
        await discardBlob(old);
        resets.push(key);
      }
      continue;
    }
    if (def.kind === "link") {
      rows.push({ key, value: links[key] ?? "", updatedAt: now });
      continue;
    }
    const raw = formData.get(key);
    if (typeof raw !== "string") continue;
    const max = def.kind === "line" ? 300 : 4000;
    rows.push({ key, value: raw.trim().slice(0, max), updatedAt: now });
  }

  for (const row of rows) {
    await db
      .insert(siteSetting)
      .values(row)
      .onConflictDoUpdate({
        target: siteSetting.key,
        set: { value: row.value, updatedAt: now },
      });
  }
  if (resets.length) {
    await db.delete(siteSetting).where(inArray(siteSetting.key, resets));
  }
  revalidatePath("/", "layout");
  redirect("/admin/site?saved=1");
}

