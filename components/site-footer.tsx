import { NAV_LINKS } from "@/lib/nav";

export function SiteFooter({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <a className="wordmark" href="/">
              Winterhaven Village
            </a>
            <p className="tagline">Desert living, neighborly spirit.</p>
          </div>
          <div className="footer-nav">
            {NAV_LINKS.map(([label, href]) => (
              <a key={label} href={href}>
                {label}
              </a>
            ))}
            {signedIn ? (
              <a href="/profile">My Profile</a>
            ) : (
              <a href="/login">Sign In</a>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            Winterhaven Village Homeowners Association · Tucson, Arizona · Est.
            1987
          </p>
          <p>Alpha prototype — every name, photo, and story is fictional.</p>
        </div>
      </div>
    </footer>
  );
}
