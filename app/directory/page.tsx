import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profile } from "@/lib/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResidentGate } from "@/components/resident-gate";

export default async function DirectoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return (
      <ResidentGate
        eyebrow="Resident Directory"
        title="Resident Directory"
        lede="The neighbors of Winterhaven Village — listings are opt-in, and residents choose exactly what to share."
        active="/directory"
        features={[
          "Neighbors' photos, bios, and contact info",
          "Pets of the village, by name",
          "Opt-in only — every resident controls their own listing",
        ]}
      />
    );
  }

  const rows = await db.query.profile.findMany({
    where: eq(profile.optIn, true),
    with: { user: true, pets: true },
  });
  rows.sort((a, b) => a.user.name.localeCompare(b.user.name));

  return (
    <>
      <SiteHeader signedIn isAdmin={session.user.role === "admin"} active="/directory" />
      <main className="board-main dir-main">
        <p className="eyebrow">Residents Only</p>
        <h1 className="section-title">Resident Directory</h1>
        <p className="board-lede">
          The neighbors of Winterhaven Village — listings are opt-in, and
          residents choose exactly what to share.
        </p>
        {rows.length === 0 ? (
          <p className="board-empty">
            The directory is brand new — add your profile and be the first
            listing.
          </p>
        ) : (
          <div className="people-grid">
            {rows.map((r) => (
              <a
                className="person-card"
                href={`/directory/${r.userId}`}
                key={r.userId}
              >
                <figure className="person-photo">
                  {r.photoKey ? (
                    <img src={`/api/photos/${r.photoKey}`} alt={r.user.name} />
                  ) : (
                    <div className="dir-initial" aria-hidden="true">
                      {r.user.name[0]}
                    </div>
                  )}
                </figure>
                <div className="person-body">
                  <h4>{r.user.name}</h4>
                  {r.unit && <p className="street">{r.unit}</p>}
                  {r.pets.length > 0 && (
                    <p className="pets">
                      with {r.pets.map((p) => p.name).join(" & ")}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
      <SiteFooter signedIn />
    </>
  );
}
