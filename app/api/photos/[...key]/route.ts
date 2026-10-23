import { get } from "@vercel/blob";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { parseSizedKey } from "@/lib/photo-sizes";
import { storeSize } from "@/lib/uploads";

/* Session-checked proxy for the private blob store. Resident photos
   are never served from a public URL. Keys under site/ hold the
   public homepage imagery and are served to everyone.

   Photos come in sized copies made at upload (lib/photo-sizes.ts). A
   copy that doesn't exist yet (a photo from before sizes existed) is
   made from the original on first request and stored. Keys are random
   and never reused, so responses can be cached as immutable. */

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> }
) {
  const { key } = await ctx.params;
  const pathname = key.join("/");
  if (pathname.includes("..") || !/^[\w\-./]+$/.test(pathname)) {
    return new Response("Bad request", { status: 400 });
  }

  const isPublic = key[0] === "site";
  if (!isPublic) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new Response("Unauthorized", { status: 401 });
  }
  const cacheControl = `${isPublic ? "public" : "private"}, max-age=31536000, immutable`;

  const result = await get(pathname, { access: "private" });
  if (result?.statusCode === 200) {
    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType ?? "application/octet-stream",
        "Cache-Control": cacheControl,
      },
    });
  }

  const sized = parseSizedKey(pathname);
  const original = sized && (await get(sized.original, { access: "private" }));
  if (
    !sized ||
    !original ||
    original.statusCode !== 200 ||
    !original.blob.contentType?.startsWith("image/")
  ) {
    return new Response("Not found", { status: 404 });
  }
  const input = Buffer.from(await new Response(original.stream).arrayBuffer());
  const body = await storeSize(sized.original, input, sized.width);
  return new Response(new Uint8Array(body), {
    headers: { "Content-Type": "image/webp", "Cache-Control": cacheControl },
  });
}
