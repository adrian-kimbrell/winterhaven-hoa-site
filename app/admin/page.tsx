import { count, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  boardMember,
  boardPost,
  ccrQuestion,
  comment,
  lighterPost,
  newsStory,
  thread,
  user,
} from "@/lib/schema";

async function tally(table: typeof newsStory | typeof lighterPost | typeof boardPost | typeof ccrQuestion) {
  const [row] = await db
    .select({ all: count(), drafts: count(sql`case when ${table.status} = 'draft' then 1 end`) })
    .from(table);
  return row;
}

function describe(t: { all: number; drafts: number }, noun: string) {
  if (t.all === 0) return `No ${noun}s yet`;
  return `${t.all} ${noun}${t.all === 1 ? "" : "s"}${t.drafts ? ` · ${t.drafts} draft${t.drafts === 1 ? "" : "s"}` : ""}`;
}

export default async function AdminPage() {
  await requireAdmin();
  const [news, lighter, board, ccrs, [members], [people], [hiddenThreads], [hiddenComments]] = await Promise.all([
    tally(newsStory),
    tally(lighterPost),
    tally(boardPost),
    tally(ccrQuestion),
    db.select({ n: count() }).from(boardMember),
    db.select({ n: count() }).from(user),
    db.select({ n: count() }).from(thread).where(eq(thread.status, "hidden")),
    db
      .select({ n: count() })
      .from(comment)
      .where(eq(comment.status, "hidden")),
  ]);

  const modules = [
    {
      title: "Community News",
      desc: "Weekly stories with photos. The newest fill the homepage.",
      href: "/admin/news",
      stat: describe(news, "story"),
      action: ["/admin/news/new", "Write a story"],
    },
    {
      title: "The Lighter Side",
      desc: "The humor column and caption contests.",
      href: "/admin/lighter",
      stat: describe(lighter, "piece"),
      action: ["/admin/lighter/new", "Write a piece"],
    },
    {
      title: "Board Updates & Minutes",
      desc: "Project updates, meeting minutes, and board member bios.",
      href: "/admin/board",
      stat: `${describe(board, "post")} · ${members.n} board member${members.n === 1 ? "" : "s"}`,
      action: ["/admin/board/posts/new", "Post an update"],
    },
    {
      title: "CC&R Corner",
      desc: "The question of the week and its archive.",
      href: "/admin/ccrs",
      stat: describe(ccrs, "question"),
      action: ["/admin/ccrs/new", "Answer a question"],
    },
    {
      title: "Residents & Accounts",
      desc: "Add residents, reset passwords, edit profiles.",
      href: "/admin/residents",
      stat: `${people.n} account${people.n === 1 ? "" : "s"}`,
      action: ["/admin/residents/new", "Add a resident"],
    },
    {
      title: "Site Settings",
      desc: "Mission statement, homepage words and photos, footer.",
      href: "/admin/site",
      stat: "Public homepage and site-wide text",
      action: ["/admin/site", "Edit settings"],
    },
    {
      title: "Community Board",
      desc: "Moderate the forum — hide or restore topics and replies.",
      href: "/community",
      stat: `${hiddenThreads.n + hiddenComments.n} hidden item${hiddenThreads.n + hiddenComments.n === 1 ? "" : "s"}`,
      action: ["/community", "Open the board"],
    },
  ] as const;

  return (
    <>
      <p className="eyebrow">Administration</p>
      <h1 className="section-title">Site Management</h1>
      <p className="admin-lede">
        Everything on the site — news, columns, minutes, the directory, the
        homepage itself — is managed from here.
      </p>
      <div className="admin-grid">
        {modules.map((m) => (
          <div className="admin-card" key={m.title}>
            <a className="admin-card-title" href={m.href}>
              <h2>{m.title}</h2>
            </a>
            <p>{m.desc}</p>
            <p className="admin-stat">{m.stat}</p>
            <a className="text-link" href={m.action[0]}>
              {m.action[1]}
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
