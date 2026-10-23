import { headers } from "next/headers";
import { and, count, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comment } from "@/lib/schema";
import { getSettings } from "@/lib/site";
import { dateFmt } from "@/lib/content";
import { publishedLighter } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResidentGate } from "@/components/resident-gate";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "The Lighter Side" };

export default async function LighterPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const site = await getSettings();
  if (!session) {
    return (
      <ResidentGate
        eyebrow="The Lighter Side"
        title="The Lighter Side"
        lede={site.lighterLede}
        active="/lighter"
        features={[
          "A humor column twice a week",
          "Caption contests with neighbors' entries",
          "Nothing about HOA dues, we promise",
        ]}
      />
    );
  }
  const posts = await publishedLighter();
  const counts = posts.length
    ? await db
        .select({ id: comment.targetId, n: count() })
        .from(comment)
        .where(
          and(
            eq(comment.targetType, "lighter"),
            eq(comment.status, "visible"),
            inArray(
              comment.targetId,
              posts.map((p) => p.id)
            )
          )
        )
        .groupBy(comment.targetId)
    : [];
  const countOf = new Map(counts.map((c) => [c.id, c.n]));

  return (
    <>
      <SiteHeader signedIn isAdmin={session.user.role === "admin"} active="/lighter" />
      <main className="board-main">
        <p className="eyebrow">Humor Column</p>
        <h1 className="section-title">The Lighter Side</h1>
        <p className="board-lede">{site.lighterLede}</p>
        {posts.length === 0 ? (
          <p className="board-empty">The first column is on its way.</p>
        ) : (
          <div className="thread-list lighter-list">
            {posts.map((p) => {
              const n = countOf.get(p.id) ?? 0;
              return (
                <a className="thread-row" href={`/lighter/${p.id}`} key={p.id}>
                  <div>
                    <h2 className="thread-title lighter-title">{p.title}</h2>
                    <p className="thread-meta">
                      {p.publishedAt ? dateFmt.format(p.publishedAt) : ""}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>
                  {p.allowComments && (
                    <div className="thread-replies">
                      <span className="thread-count">{n}</span>
                      <span className="thread-count-label">
                        {n === 1 ? "comment" : "comments"}
                      </span>
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
