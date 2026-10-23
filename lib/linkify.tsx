import type { ReactNode } from "react";

/* Turns admin-entered text into React nodes with clickable links.
   Recognized, in plain text:
     - [words](https://address)   the words become a link
     - https://... or www....     the address becomes a link
     - name@example.com           becomes an email link
   Anything else stays text; nothing is ever parsed as HTML. */

const TOKEN =
  /\[([^\]\n]+)\]\(([^)\s]+)\)|((?:https?:\/\/|www\.)[^\s<]+)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

// Sentence punctuation right after a bare address belongs to the sentence.
const TRAILING = /[.,;:!?)"'\]]+$/;

/* A safe href for a typed address, or null if it isn't one. Only web,
   email, and phone links are allowed (never javascript: and the like). */
export function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(value)) return `mailto:${value}`;
  if (/^www\./i.test(value)) return `https://${value}`;
  if (/^(https?:\/\/|mailto:|tel:)\S+$/i.test(value)) return value;
  return null;
}

function link(href: string, label: string, key: number) {
  const external = /^https?:/i.test(href);
  return (
    <a
      key={key}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {label}
    </a>
  );
}

export function linkify(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(TOKEN)) {
    const [whole, label, target, bare, email] = m;
    let end = m.index + whole.length;
    let node: ReactNode = null;

    if (label !== undefined) {
      const href = safeHref(target);
      node = href ? link(href, label, key++) : null;
    } else if (bare !== undefined) {
      const trimmed = bare.replace(TRAILING, "");
      end = m.index + trimmed.length;
      const href = safeHref(trimmed);
      node = href ? link(href, trimmed, key++) : null;
    } else if (email !== undefined) {
      node = link(`mailto:${email}`, email, key++);
    }
    if (!node) continue;

    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(node);
    last = end;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
