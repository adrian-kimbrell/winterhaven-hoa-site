import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profile } from "@/lib/schema";
import { mapboxToken, MAP_STYLE, MAP_ZOOM, MAP_SIZE } from "@/lib/map";

/* The Mapbox picture behind a resident's map, fetched here so the
   access token and the home's coordinates never appear in the page.
   Same visibility as the profile itself: signed in, and the resident
   is listed (or it's you, or you're an admin). */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const token = mapboxToken();
  if (!token) return new Response("Not found", { status: 404 });

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const row = await db.query.profile.findFirst({ where: eq(profile.userId, id) });
  const canSee =
    row && (row.optIn || id === session.user.id || session.user.role === "admin");
  if (!canSee || row.latitude == null || row.longitude == null) {
    return new Response("Not found", { status: 404 });
  }

  const center = `${row.longitude.toFixed(6)},${row.latitude.toFixed(6)},${MAP_ZOOM},0,0`;
  const url = `https://api.mapbox.com/styles/v1/${MAP_STYLE}/static/${center}/${MAP_SIZE}@2x?access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) return new Response("Map unavailable", { status: 502 });

  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/png",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
