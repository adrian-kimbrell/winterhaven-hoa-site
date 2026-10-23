/* Buttons for the newsletter and resident portal (set in Site
   Settings). Both open in a new tab: one is a PDF, the other a
   separate site. Renders nothing when neither is set. */
export function ResidentLinks({
  links,
  className,
}: {
  links: ({ href: string; label: string } | null)[];
  className: string;
}) {
  const shown = links.filter((l) => l !== null);
  if (shown.length === 0) return null;
  return (
    <div className={className}>
      {shown.map((l, i) => (
        <a
          key={l.href}
          className={i === 0 ? "btn" : "btn btn-ghost"}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
