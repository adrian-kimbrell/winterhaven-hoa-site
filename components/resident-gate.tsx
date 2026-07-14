import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/* Public face of a residents-only page: introduces the section,
   previews what's inside, and invites residents in. */
export function ResidentGate({
  eyebrow,
  title,
  lede,
  active,
  features,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  active: string;
  features: string[];
}) {
  return (
    <>
      <SiteHeader active={active} />
      <main className="board-main">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="section-title">{title}</h1>
        <p className="board-lede">{lede}</p>
        <div className="gate-grid">
          <div>
            <h2 className="gate-heading">What you&rsquo;ll find here</h2>
            <ul className="gate-features">
              {features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div className="gate-cta">
            <p className="gate-note">
              This page is for Winterhaven Village residents.
            </p>
            <a className="btn" href="/login">
              Resident Sign In
            </a>
            <p className="auth-note">
              Accounts are created by the HOA. Need access? Contact a board
              member and we&rsquo;ll get you set up.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
