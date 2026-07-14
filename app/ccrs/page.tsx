import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResidentGate } from "@/components/resident-gate";

/* Placeholder content until the CC&R module lands (weekly Q&A with a
   comment thread per question, reusing the comments table). */
const PAST_QUESTIONS = [
  {
    q: "Do I need approval to repaint my front door?",
    a: "Only if the color changes — the approved palette is in appendix B, and anything on it is pre-approved.",
  },
  {
    q: "Are clotheslines allowed in backyards?",
    a: "Yes, so long as they are not visible from the street — see section 6.2.",
  },
];

export default async function CcrsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return (
      <ResidentGate
        eyebrow="CC&amp;R Corner"
        title="Covenants, Plainly Answered"
        lede="One resident question about the CC&amp;Rs answered every week — in plain English, with the section reference for the curious."
        active="/ccrs"
        features={[
          "A new resident question answered every week",
          "Plain-English answers with section references",
          "A growing archive of past questions",
        ]}
      />
    );
  }

  return (
    <>
      <SiteHeader signedIn active="/ccrs" />
      <main className="board-main">
        <p className="eyebrow">CC&amp;R Corner</p>
        <h1 className="section-title">Covenants, Plainly Answered</h1>
        <p className="board-lede">
          One resident question about the CC&amp;Rs answered every week — in
          plain English, with the section reference for the curious.
        </p>

        <h2 className="replies-head">Question of the Week</h2>
        <div className="ccr-card">
          <p className="q">&ldquo;Can I park my RV in my driveway overnight?&rdquo;</p>
          <p className="a">
            <strong>Yes, briefly.</strong> Up to 72 hours for loading and
            unloading — see section 4.3 of the CC&amp;Rs for the details and
            how to request an extension.
          </p>
        </div>

        <h2 className="replies-head">Recent Questions</h2>
        <ul className="board-list">
          {PAST_QUESTIONS.map((item) => (
            <li key={item.q}>
              <p className="board-kind">Answered</p>
              <h4>{item.q}</h4>
              <p>{item.a}</p>
            </li>
          ))}
        </ul>

        <p className="optin-note">
          Comments on each question and the full searchable archive arrive
          with the CC&amp;R module — placeholder questions until then.
        </p>
      </main>
      <SiteFooter signedIn />
    </>
  );
}
