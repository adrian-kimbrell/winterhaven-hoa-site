import { NAV_LINKS } from "@/lib/nav";
import { NavSignOut } from "./nav-sign-out";

/* Solid header for interior pages (the homepage hero carries its own). */
export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <nav className="nav site-header">
      <a className="wordmark" href="/">
        Winterhaven Village
      </a>
      <div className="nav-links">
        {NAV_LINKS.map(([label, href]) => (
          <a key={label} href={href}>
            {label}
          </a>
        ))}
        {signedIn ? (
          <>
            <a href="/profile">My Profile</a>
            <NavSignOut />
          </>
        ) : (
          <a href="/login">Sign In</a>
        )}
      </div>
    </nav>
  );
}
