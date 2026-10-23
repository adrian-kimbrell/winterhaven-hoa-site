import { paragraphs } from "@/lib/site";
import { linkify } from "@/lib/linkify";

/* Admin-entered text: blank lines separate paragraphs; single line
   breaks are kept; web and email addresses become links. */
export function Prose({ text, className = "prose" }: { text: string; className?: string }) {
  const paras = paragraphs(text);
  if (paras.length === 0) return null;
  return (
    <div className={className}>
      {paras.map((p, i) => (
        <p key={i}>{linkify(p)}</p>
      ))}
    </div>
  );
}
