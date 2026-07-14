import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/* Placeholder content until the board module lands (minutes uploads,
   project tracker, member bios per the requirements). */
const MINUTES = [
  { month: "May 2026", note: "Posted — clubhouse bids, pool schedule, monsoon prep." },
  { month: "April 2026", note: "Posted — landscaping contract renewal, east gate garden." },
  { month: "March 2026", note: "Posted — annual budget review." },
];

export default async function BoardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <>
      <SiteHeader signedIn />
      <main className="board-main">
        <p className="eyebrow">From the Board</p>
        <h1 className="section-title">Board Updates &amp; Minutes</h1>
        <p className="board-lede">
          What your board is working on, decided, and planning — posted here
          first, frequently and plainly.
        </p>

        <h2 className="replies-head">Current Projects</h2>
        <ul className="board-list">
          <li>
            <p className="board-kind">Project Update</p>
            <h4>Clubhouse facelift: bids under review</h4>
            <p>
              Proposals are being evaluated in two parts — structural work and
              cosmetic refresh. A recommendation goes to the board this month.
            </p>
          </li>
          <li>
            <p className="board-kind">Project Update</p>
            <h4>Pool resurfacing</h4>
            <p>
              Begins Monday; two-week closure. Weekly progress notes will be
              posted in the community news.
            </p>
          </li>
        </ul>

        <h2 className="replies-head">Meeting Minutes</h2>
        <ul className="board-list">
          {MINUTES.map((m) => (
            <li key={m.month}>
              <p className="board-kind">Minutes</p>
              <h4>{m.month}</h4>
              <p>{m.note}</p>
            </li>
          ))}
        </ul>

        <p className="optin-note">
          Board member photos, bios, and downloadable minutes arrive with the
          board module — placeholder entries until then.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
