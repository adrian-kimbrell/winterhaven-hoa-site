import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profile } from "@/lib/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function DirectoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const rows = await db.query.profile.findMany({
    where: eq(profile.optIn, true),
    with: { user: true, pets: true },
  });
  rows.sort((a, b) => a.user.name.localeCompare(b.user.name));

  return (
    <>
      <SiteHeader signedIn />
      <main className="board-main dir-main">
        <p className="eyebrow">Residents Only</p>
        <h1 className="section-title">Resident Directory</h1>
        <p className="board-lede">
          The neighbors of Winterhaven Village — listings are opt-in, and
          residents choose exactly what to share.
        </p>
        <div className="dir-bar">
          <a className="btn" href="/profile">
            Edit My Profile
          </a>
        </div>

        {rows.length === 0 ? (
          <p className="board-empty">
            The directory is brand new — add your profile and be the first
            listing.
          </p>
        ) : (
          <div className="neighbor-grid dir-grid">
            {rows.map((r) => (
              <a
                className="neighbor-card"
                href={`/directory/${r.userId}`}
                key={r.userId}
              >
                <figure className="dir-figure">
                  {r.photoKey ? (
                    <img src={`/api/photos/${r.photoKey}`} alt={r.user.name} />
                  ) : (
                    <div className="dir-initial" aria-hidden="true">
                      {r.user.name[0]}
                    </div>
                  )}
                </figure>
                <h4>{r.user.name}</h4>
                {r.unit && <p className="street">{r.unit}</p>}
                {r.pets.length > 0 && (
                  <p className="pets">
                    with {r.pets.map((p) => p.name).join(" & ")}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
