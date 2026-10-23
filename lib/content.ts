import { z } from "zod";

export type Status = "draft" | "published";

export function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

export function optional(formData: FormData, name: string, max: number) {
  const v = field(formData, name).slice(0, max);
  return v === "" ? null : v;
}

export const required = (max: number) => z.string().trim().min(1).max(max);

/* Editor forms submit with intent=publish or intent=draft. The first
   publish stamps publishedAt; later edits keep the original date so
   ordering stays stable. */
export function publishState(
  formData: FormData,
  existing?: { publishedAt: Date | null } | null
): { status: Status; publishedAt: Date | null } {
  const publish = formData.get("intent") === "publish";
  return {
    status: publish ? "published" : "draft",
    publishedAt: publish
      ? (existing?.publishedAt ?? new Date())
      : (existing?.publishedAt ?? null),
  };
}

export const dateFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "America/Phoenix",
});
