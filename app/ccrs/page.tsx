import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/site";
import { excerpt, publishedQuestions } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResidentGate } from "@/components/resident-gate";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "CC&R Corner" };

export default async function CcrsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const site = await getSettings();
  if (!session) {
    return (
      <ResidentGate
        eyebrow="CC&amp;R Corner"
        title="Covenants, Plainly Answered"
        lede={site.ccrLede}
        active="/ccrs"
        features={[
          "A new resident question answered every week",
          "Plain-English answers with section references",
          "A growing archive of past questions",
        ]}
      />
    );
  }
  const [current, ...past] = await publishedQuestions();

  return (
    <>
      <SiteHeader signedIn isAdmin={session.user.role === "admin"} active="/ccrs" />
      <main className="board-main">
        <p className="eyebrow">CC&amp;R Corner</p>
        <h1 className="section-title">Covenants, Plainly Answered</h1>
        <p className="board-lede">{site.ccrLede}</p>

        {!current ? (
          <p className="board-empty">The first question is on its way.</p>
        ) : (
          <>
            <h2 className="replies-head">Question of the Week</h2>
            <div className="ccr-card">
              <p className="q">&ldquo;{current.question}&rdquo;</p>
              <p className="a">
                {current.shortAnswer && <strong>{current.shortAnswer} </strong>}
                {excerpt(null, current.answer, 320)}
              </p>
              <div className="ccr-links">
                <a className="text-link" href={`/ccrs/${current.id}`}>
                  Full answer &amp; comments
                </a>
              </div>
            </div>
          </>
        )}

        {past.length > 0 && (
          <>
            <h2 className="replies-head">Past Questions</h2>
            <div className="thread-list">
              {past.map((q) => (
                <a className="thread-row" href={`/ccrs/${q.id}`} key={q.id}>
                  <div>
                    <h3 className="thread-title">{q.question}</h3>
                    <p className="thread-meta">
                      {[q.shortAnswer, q.sectionRef].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
