import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/site";
import { blobUrl } from "@/lib/uploads";
import { dateFmt } from "@/lib/content";
import { boardMembers, publishedBoardPosts } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResidentGate } from "@/components/resident-gate";
import { Prose } from "@/components/prose";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Board Updates & Minutes" };

/* Meeting dates are stored as YYYY-MM-DD; format them without a
   timezone shift. */
function meetingDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return dateFmt.format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export default async function BoardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const site = await getSettings();
  if (!session) {
    return (
      <ResidentGate
        eyebrow="From the Board"
        title="Board Updates &amp; Minutes"
        lede={site.boardLede}
        active="/board"
        features={[
          "Minutes from every board meeting",
          "Live updates on village projects",
          "Board member contacts and bios",
        ]}
      />
    );
  }
  const [posts, members] = await Promise.all([publishedBoardPosts(), boardMembers()]);
  const updates = posts.filter((p) => p.kind !== "minutes");
  const minutes = posts.filter((p) => p.kind === "minutes");

  return (
    <>
      <SiteHeader signedIn isAdmin={session.user.role === "admin"} active="/board" />
      <main className="board-main">
        <p className="eyebrow">From the Board</p>
        <h1 className="section-title">Board Updates &amp; Minutes</h1>
        <p className="board-lede">{site.boardLede}</p>

        {members.length > 0 && (
          <>
            <h2 className="replies-head">Your Board</h2>
            <div className="member-grid">
              {members.map((m) => (
                <article className="member-card" key={m.id}>
                  <figure className="member-photo">
                    {m.photoKey ? (
                      <img src={blobUrl(m.photoKey, 320)} alt={m.name} />
                    ) : (
                      <div className="dir-initial" aria-hidden="true">
                        {m.name[0]}
                      </div>
                    )}
                  </figure>
                  <div>
                    {m.position && <p className="board-kind">{m.position}</p>}
                    <h3 className="member-name">{m.name}</h3>
                    {(m.email || m.phone) && (
                      <p className="member-contact">
                        {m.email && <a href={`mailto:${m.email}`}>{m.email}</a>}
                        {m.email && m.phone && " · "}
                        {m.phone}
                      </p>
                    )}
                    {m.bio && <Prose text={m.bio} className="prose member-bio" />}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <h2 className="replies-head">Current Projects</h2>
        {updates.length === 0 ? (
          <p className="comment-empty">No project updates yet.</p>
        ) : (
          <ul className="board-list board-posts">
            {updates.map((p) => (
              <li key={p.id} id={`post-${p.id}`}>
                <p className="board-kind">
                  Project Update
                  {p.publishedAt ? ` · ${dateFmt.format(p.publishedAt)}` : ""}
                </p>
                <h3>{p.title}</h3>
                <Prose text={p.body} />
                {p.documentKey && (
                  <a className="text-link" href={blobUrl(p.documentKey)} target="_blank" rel="noreferrer">
                    {p.documentName ?? "Attached document"}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        <h2 className="replies-head">Meeting Minutes</h2>
        {minutes.length === 0 ? (
          <p className="comment-empty">No minutes posted yet.</p>
        ) : (
          <ul className="board-list board-posts">
            {minutes.map((p) => (
              <li key={p.id} id={`post-${p.id}`}>
                <p className="board-kind">
                  Minutes
                  {p.meetingDate ? ` · Meeting of ${meetingDate(p.meetingDate)}` : ""}
                </p>
                <h3>{p.title}</h3>
                <Prose text={p.body} />
                {p.documentKey && (
                  <a className="text-link" href={blobUrl(p.documentKey)} target="_blank" rel="noreferrer">
                    Open the minutes{p.documentName ? ` (${p.documentName})` : ""}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
