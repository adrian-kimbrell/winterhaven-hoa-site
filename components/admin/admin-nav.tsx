"use client";

import { usePathname } from "next/navigation";

const LINKS = [
  ["Overview", "/admin"],
  ["News", "/admin/news"],
  ["Lighter Side", "/admin/lighter"],
  ["Board", "/admin/board"],
  ["CC&Rs", "/admin/ccrs"],
  ["Residents", "/admin/residents"],
  ["Site Settings", "/admin/site"],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-tabs" aria-label="Administration">
      {LINKS.map(([label, href]) => {
        const active =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <a
            key={href}
            href={href}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
