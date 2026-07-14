import { get } from "@vercel/blob";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/* Session-checked proxy for the private blob store. Resident photos
   are never served from a public URL. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { key } = await ctx.params;
  const pathname = key.join("/");
  if (pathname.includes("..") || !/^[\w\-./]+$/.test(pathname)) {
    return new Response("Bad request", { status: 400 });
  }

  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
