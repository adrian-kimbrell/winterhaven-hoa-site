import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pet, profile } from "@/lib/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function ResidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { id } = await params;
  const isAdmin = session.user.role === "admin";
  const isSelf = id === session.user.id;

  const row = await db.query.profile.findFirst({
    where: eq(profile.userId, id),
    with: { user: true },
  });
  if (!row || (!row.optIn && !isSelf && !isAdmin)) notFound();

  const pets = await db.query.pet.findMany({
    where: eq(pet.userId, id),
    orderBy: [asc(pet.createdAt)],
  });

  const contact = (
    [
      ["Address", row.unit],
      ["Phone", row.phone],
      ["Email", row.user.email],
    ] as const
  ).filter(([, v]) => v);

  return (
    <>
      <SiteHeader signedIn isAdmin={isAdmin} active="/directory" />
      <main className="board-main">
        <a className="text-link thread-back" href="/directory">
          Full directory
        </a>

        {!row.optIn && (
          <p className="auth-error">
            This profile is not listed in the directory yet — only{" "}
            {isSelf ? "you" : "the resident"} and administrators can see this
            preview.
          </p>
        )}

        <div className="resident-layout">
          <aside className="resident-rail">
            <figure className="resident-photo">
              {row.photoKey ? (
                <img src={`/api/photos/${row.photoKey}`} alt={row.user.name} />
              ) : (
                <div className="dir-initial" aria-hidden="true">
                  {row.user.name[0]}
                </div>
              )}
            </figure>
            {contact.length > 0 && (
              <div className="resident-contact">
                {contact.map(([label, value]) => (
                  <div className="contact-row" key={label}>
                    <span className="contact-label">{label}</span>
                    <span className="contact-value">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>

          <div className="resident-body-col">
            <p className="eyebrow">Resident</p>
            <h1 className="section-title">{row.user.name}</h1>
            {row.unit && <p className="resident-unit">{row.unit}</p>}

            {row.bio && (
              <section className="resident-section">
                <h2 className="replies-head">About</h2>
                <p className="thread-body">{row.bio}</p>
              </section>
            )}

            {row.facts && (
              <section className="resident-section">
                <h2 className="replies-head">Worth Knowing</h2>
                <p className="thread-body">{row.facts}</p>
              </section>
            )}

            {pets.length > 0 && (
              <section className="resident-section">
                <h2 className="replies-head">
                  {pets.length === 1 ? "Pet" : "Pets"}
                </h2>
                <div className="pet-cards">
                  {pets.map((p) => (
                    <figure className="pet-card" key={p.id}>
                      {p.photoKey ? (
                        <img src={`/api/photos/${p.photoKey}`} alt={p.name} />
                      ) : (
                        <div className="pet-card-empty" aria-hidden="true">
                          {p.name[0]}
                        </div>
                      )}
                      <figcaption>
                        <span className="pet-name">{p.name}</span>
                        {p.species && (
                          <span className="pet-species">{p.species}</span>
                        )}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {row.residencePhotoKey && (
          <section className="resident-section residence-section">
            <h2 className="replies-head">The Residence</h2>
            <img
              className="residence-photo"
              src={`/api/photos/${row.residencePhotoKey}`}
              alt={`${row.user.name}'s residence`}
            />
          </section>
        )}

        <p className="optin-note">
          Directory listings are opt-in. Residents choose what to share.
        </p>
      </main>
      <SiteFooter signedIn />
    </>
  );
}
