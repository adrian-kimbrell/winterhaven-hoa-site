"use client";

import { useEffect, useState } from "react";

/* The nav's link list. On phones it collapses behind a Menu button so
   the header stays one short, pinned bar; on wider screens the button
   is hidden and the links show inline. */
export function NavMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="nav-toggle-icon" aria-hidden="true" />
        {open ? "Close" : "Menu"}
      </button>
      <div
        id="site-menu"
        className={open ? "nav-links nav-open" : "nav-links"}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        {children}
      </div>
    </>
  );
}
