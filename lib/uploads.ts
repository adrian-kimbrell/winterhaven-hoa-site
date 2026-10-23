import { randomUUID } from "crypto";
import { del, put } from "@vercel/blob";
import sharp from "sharp";
import { PHOTO_WIDTHS, sizedKey, snapWidth, type PhotoWidth } from "./photo-sizes";

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const DOCUMENT_TYPES: Record<string, string> = {
  ...IMAGE_TYPES,
  "application/pdf": "pdf",
};
export const IMAGE_ACCEPT = Object.keys(IMAGE_TYPES).join(",");
export const DOCUMENT_ACCEPT = Object.keys(DOCUMENT_TYPES).join(",");

// Vercel caps request bodies at 4.5 MB; the browser shrinks photos
// first (components/upload-input.tsx), so these are backstops.
const MAX_PHOTO_BYTES = 4.5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 2000;

/* Applies the phone's rotation and caps the longest side, so every
   stored photo is upright and a sensible size to serve. */
async function normalizeImage(file: File): Promise<{ body: Buffer; type: string; ext: string }> {
  const input = Buffer.from(await file.arrayBuffer());
  const image = sharp(input, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const resized = image.resize({
    width: MAX_EDGE,
    height: MAX_EDGE,
    fit: "inside",
    withoutEnlargement: true,
  });
  if (meta.format === "png" && meta.hasAlpha) {
    return { body: await resized.png().toBuffer(), type: "image/png", ext: "png" };
  }
  return {
    body: await resized.jpeg({ quality: 82, mozjpeg: true }).toBuffer(),
    type: "image/jpeg",
    ext: "jpg",
  };
}

/* Stores an uploaded file in the private blob store. Returns its
   pathname, null when no file was chosen, or "invalid" for a wrong
   type or oversized file. */
export async function storeUpload(
  value: FormDataEntryValue | null,
  prefix: string,
  kind: "image" | "document" = "image"
): Promise<string | null | "invalid"> {
  if (!(value instanceof File) || value.size === 0) return null;
  const types = kind === "image" ? IMAGE_TYPES : DOCUMENT_TYPES;
  const max = kind === "image" ? MAX_PHOTO_BYTES : MAX_DOCUMENT_BYTES;
  const ext = types[value.type];
  if (!ext || value.size > max) return "invalid";
  if (value.type.startsWith("image/")) {
    let image: Awaited<ReturnType<typeof normalizeImage>>;
    try {
      image = await normalizeImage(value);
    } catch {
      return "invalid"; // not actually a readable image
    }
    const blob = await put(`${prefix}/${randomUUID()}.${image.ext}`, image.body, {
      access: "private",
      addRandomSuffix: false,
      contentType: image.type,
    });
    await Promise.all(PHOTO_WIDTHS.map((w) => storeSize(blob.pathname, image.body, w)));
    return blob.pathname;
  }
  const blob = await put(`${prefix}/${randomUUID()}.${ext}`, value, {
    access: "private",
    addRandomSuffix: false,
    contentType: value.type,
  });
  return blob.pathname;
}

/* Makes and stores one WebP copy of a photo; returns its bytes. */
export async function storeSize(key: string, original: Buffer, width: PhotoWidth) {
  const body = await sharp(original, { failOn: "none" })
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();
  await put(sizedKey(key, width), body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "image/webp",
  });
  return body;
}

/* Deletes a stored file and, for photos, its sized copies. */
export async function discardBlob(pathname: string | null | undefined) {
  if (!pathname) return;
  try {
    const isImage = /\.(jpg|png|webp)$/.test(pathname);
    await del([pathname, ...(isImage ? PHOTO_WIDTHS.map((w) => sizedKey(pathname, w)) : [])]);
  } catch {
    /* best effort — an orphaned blob is not worth failing the save */
  }
}

/* Blob pathnames are served through the photo proxy. Keys under
   site/ are public (homepage imagery); everything else needs a
   signed-in resident. With a width, the smallest stored copy at
   least that wide. */
export function blobUrl(key: string, width?: number) {
  return `/api/photos/${width ? sizedKey(key, snapWidth(width)) : key}`;
}
