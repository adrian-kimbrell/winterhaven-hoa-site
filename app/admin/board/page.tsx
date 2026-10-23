import { asc, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { boardMember, boardPost } from "@/lib/schema";
import { dateFmt } from "@/lib/content";
import { StatusPill } from "@/components/admin/editor";

export default async function AdminBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const posts = await db
    .select()
    .from(boardPost)
    .orderBy(desc(boardPost.publishedAt), desc(boardPost.createdAt));
  const members = await db
    .select()
    .from(boardMember)
    .orderBy(asc(boardMember.sortOrder), asc(boardMember.name));

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">From the Board</p>
          <h1 className="section-title">Updates &amp; Minutes</h1>
          <p className="admin-lede">
            Project updates and meeting minutes, newest first. Attach the
            minutes document (PDF) to a minutes post.
          </p>
        </div>
        <a className="btn" href="/admin/board/posts/new">
          New Post
        </a>
      </div>
      {deleted && (
        <p className="save-note">
          {deleted === "member" ? "Board member removed." : "Post deleted."}
        </p>
      )}
      {posts.length === 0 ? (
        <p className="board-empty">No updates or minutes yet.</p>
      ) : (
        <div className="thread-list">
          {posts.map((p) => (
            <a className="thread-row" href={`/admin/board/posts/${p.id}`} key={p.id}>
              <div>
                <h2 className="thread-title">
                  {p.title}
                  <StatusPill status={p.status} />
                </h2>
                <p className="thread-meta">
                  {p.kind === "minutes" ? "Meeting minutes" : "Project update"}
                  {" · "}
                  {p.publishedAt
                    ? `Published ${dateFmt.format(p.publishedAt)}`
                    : `Created ${dateFmt.format(p.createdAt)}`}
                  {p.documentName ? ` · ${p.documentName}` : ""}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="admin-head admin-head-sub">
        <div>
          <h2 className="replies-head">Board Members</h2>
          <p className="admin-lede">
            Shown on the Board page with photo, contact details, and bio.
          </p>
        </div>
        <a className="btn btn-quiet" href="/admin/board/members/new">
          Add Member
        </a>
      </div>
      {members.length === 0 ? (
        <p className="board-empty">No board members listed yet.</p>
      ) : (
        <div className="thread-list">
          {members.map((m) => (
            <a className="thread-row" href={`/admin/board/members/${m.id}`} key={m.id}>
              <div>
                <h3 className="thread-title">{m.name}</h3>
                <p className="thread-meta">
                  {[m.position, m.email, m.phone].filter(Boolean).join(" · ") ||
                    "No details yet"}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
