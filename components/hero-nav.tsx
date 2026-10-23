"use client";

import { useEffect, useRef, useState } from "react";

/* Homepage nav: sticky, transparent over the hero photo, solid once
   the photo has scrolled away. The overlay itself is pure CSS (.home
   grid in globals.css); this only toggles the solid state. */
export function HeroNav({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const nav = ref.current;
    const hero = nav?.nextElementSibling as HTMLElement | null;
    if (!nav || !hero) return;

    const update = () => {
      const heroBottom = hero.getBoundingClientRect().bottom;
      setSolid(heroBottom <= nav.offsetHeight);
    };

    update();
    const resize = new ResizeObserver(update);
    resize.observe(nav);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <nav ref={ref} className={`nav hero-nav${solid ? " hero-nav-solid" : ""}`}>
      {children}
    </nav>
  );
}
