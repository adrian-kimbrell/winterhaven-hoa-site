import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { lighterPost } from "@/lib/schema";
import { dateFmt } from "@/lib/content";
import { StatusPill } from "@/components/admin/editor";

export default async function AdminLighterPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const posts = await db
    .select()
    .from(lighterPost)
    .orderBy(desc(lighterPost.publishedAt), desc(lighterPost.createdAt));

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">The Lighter Side</p>
          <h1 className="section-title">Humor Column</h1>
          <p className="admin-lede">
            The newest published piece appears on the homepage. Turn on
            comments to run a caption contest — residents&rsquo; captions
            appear as comments.
          </p>
        </div>
        <a className="btn" href="/admin/lighter/new">
          New Piece
        </a>
      </div>
      {deleted && <p className="save-note">Piece deleted.</p>}
      {posts.length === 0 ? (
        <p className="board-empty">Nothing yet — the village awaits its first laugh.</p>
      ) : (
        <div className="thread-list">
          {posts.map((p) => (
            <a className="thread-row" href={`/admin/lighter/${p.id}`} key={p.id}>
              <div>
                <h2 className="thread-title">
                  {p.title}
                  <StatusPill status={p.status} />
                </h2>
                <p className="thread-meta">
                  {p.publishedAt
                    ? `Published ${dateFmt.format(p.publishedAt)}`
                    : `Created ${dateFmt.format(p.createdAt)}`}
                  {p.allowComments ? " · Comments on" : ""}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
