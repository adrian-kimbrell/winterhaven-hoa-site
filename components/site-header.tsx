import { NAV_LINKS } from "@/lib/nav";
import { NavSignOut } from "./nav-sign-out";

/* Solid header for interior pages (the homepage hero carries its own).
   `active` is the current page's href — that link gets the copper
   underline. */
export function SiteHeader({
  signedIn = false,
  active,
}: {
  signedIn?: boolean;
  active?: string;
}) {
  return (
    <nav className="nav site-header">
      <a className="wordmark" href="/">
        Winterhaven Village
      </a>
      <div className="nav-links">
        {NAV_LINKS.map(([label, href]) => (
          <a
            key={label}
            href={href}
            className={active === href ? "active" : undefined}
            aria-current={active === href ? "page" : undefined}
          >
            {label}
          </a>
        ))}
        {signedIn ? (
          <>
            <a
              href="/profile"
              className={active === "/profile" ? "active" : undefined}
            >
              My Profile
            </a>
            <NavSignOut />
          </>
        ) : (
          <a href="/login">Sign In</a>
        )}
      </div>
    </nav>
  );
}
