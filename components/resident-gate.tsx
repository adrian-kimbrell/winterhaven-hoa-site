import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/* Public face of a residents-only page: the page introduces itself,
   the content stays behind the password. */
export function ResidentGate({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <>
      <SiteHeader />
      <main className="board-main">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="section-title">{title}</h1>
        <p className="board-lede">{lede}</p>
        <div className="gate-card">
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
      </main>
      <SiteFooter />
    </>
  );
}
