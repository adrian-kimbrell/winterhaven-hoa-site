import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { ccrQuestion } from "@/lib/schema";
import { dateFmt } from "@/lib/content";
import { StatusPill } from "@/components/admin/editor";

export default async function AdminCcrsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const questions = await db
    .select()
    .from(ccrQuestion)
    .orderBy(desc(ccrQuestion.publishedAt), desc(ccrQuestion.createdAt));

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">CC&amp;R Corner</p>
          <h1 className="section-title">Questions &amp; Answers</h1>
          <p className="admin-lede">
            The most recently published question becomes the Question of the
            Week; earlier ones move to the archive.
          </p>
        </div>
        <a className="btn" href="/admin/ccrs/new">
          New Question
        </a>
      </div>
      {deleted && <p className="save-note">Question deleted.</p>}
      {questions.length === 0 ? (
        <p className="board-empty">No questions yet.</p>
      ) : (
        <div className="thread-list">
          {questions.map((q, i) => (
            <a className="thread-row" href={`/admin/ccrs/${q.id}`} key={q.id}>
              <div>
                <h2 className="thread-title">
                  {q.question}
                  <StatusPill status={q.status} />
                  {i === questions.findIndex((x) => x.status === "published") && (
                    <span className="pill">Question of the Week</span>
                  )}
                </h2>
                <p className="thread-meta">
                  {q.publishedAt
                    ? `Published ${dateFmt.format(q.publishedAt)}`
                    : `Created ${dateFmt.format(q.createdAt)}`}
                  {q.sectionRef ? ` · ${q.sectionRef}` : ""}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
