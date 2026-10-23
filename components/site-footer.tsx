import { getSettings } from "@/lib/site";

/* One quiet line: navigation lives in the sticky header. */
export async function SiteFooter() {
  const site = await getSettings();
  return (
    <footer className="footer">
      <div className="container footer-bar">
        <p>{site.footerLine}</p>
        {site.footerNote && <p>{site.footerNote}</p>}
      </div>
    </footer>
  );
}
