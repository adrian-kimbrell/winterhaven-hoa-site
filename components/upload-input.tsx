"use client";

import { useState } from "react";

/* Vercel rejects request bodies over 4.5 MB before our code runs, and
   a phone photo alone can be bigger than that. Photos are therefore
   shrunk in the browser before the form is sent (longest side 2000px,
   JPEG), which also bakes in the phone's rotation. Anything still too
   large is refused here with a clear message instead of a failed
   upload. The server re-checks and re-sizes regardless. */

const MAX_EDGE = 2000;
const QUALITY = 0.85;
// Leaves room for a second file and the form fields under 4.5 MB.
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // a format this browser can't decode; let the server judge
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  // Small, already-sized files are left alone (keeps PNG transparency).
  if (scale === 1 && file.size <= 600 * 1024) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
}

export function UploadInput({
  id,
  name,
  accept,
  kind = "image",
}: {
  id: string;
  name: string;
  accept: string;
  kind?: "image" | "document";
}) {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const original = input.files?.[0];
    if (!original) return setStatus("idle");
    setStatus("working");
    const file = await shrink(original);
    const limit = file.type.startsWith("image/") ? MAX_BYTES : MAX_DOCUMENT_BYTES;
    if (file.size > limit) {
      input.value = "";
      setStatus("error");
      setMessage(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${
          limit / 1024 / 1024
        } MB.${kind === "document" ? " Try saving the PDF at a smaller size." : ""}`
      );
      return;
    }
    if (file !== original) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
    }
    setStatus("idle");
  }

  return (
    <>
      <input id={id} name={name} type="file" accept={accept} onChange={onChange} />
      {status === "working" && <p className="field-help">Preparing photo…</p>}
      {status === "error" && <p className="field-help field-error">{message}</p>}
    </>
  );
}
