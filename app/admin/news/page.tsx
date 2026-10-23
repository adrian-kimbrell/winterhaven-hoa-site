import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { newsStory } from "@/lib/schema";
import { dateFmt } from "@/lib/content";
import { StatusPill } from "@/components/admin/editor";

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const stories = await db
    .select()
    .from(newsStory)
    .orderBy(desc(newsStory.publishedAt), desc(newsStory.createdAt));

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Community News</p>
          <h1 className="section-title">News Stories</h1>
          <p className="admin-lede">
            The newest published stories fill the homepage; a pinned story
            always takes the lead spot.
          </p>
        </div>
        <a className="btn" href="/admin/news/new">
          New Story
        </a>
      </div>
      {deleted && <p className="save-note">Story deleted.</p>}
      {stories.length === 0 ? (
        <p className="board-empty">No stories yet — write the first one.</p>
      ) : (
        <div className="thread-list">
          {stories.map((s) => (
            <a className="thread-row" href={`/admin/news/${s.id}`} key={s.id}>
              <div>
                <h2 className="thread-title">
                  {s.title}
                  <StatusPill status={s.status} />
                  {s.pinned && <span className="pill">Lead story</span>}
                </h2>
                <p className="thread-meta">
                  {s.publishedAt
                    ? `Published ${dateFmt.format(s.publishedAt)}`
                    : `Created ${dateFmt.format(s.createdAt)}`}
                  {s.kicker ? ` · ${s.kicker}` : ""}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
