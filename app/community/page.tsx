import { headers } from "next/headers";
import { and, count, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comment, thread, user } from "@/lib/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResidentGate } from "@/components/resident-gate";
import { createThread } from "./actions";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "America/Phoenix",
});

const ERRORS: Record<string, string> = {
  "title-empty": "Give your conversation a title.",
  "title-toolong": "Titles are capped at 120 characters.",
  "body-empty": "Write something first — the board is listening.",
  "body-toolong": "Posts are capped at 5,000 characters.",
  cooldown: "You just started a conversation — give it a minute.",
};

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return (
      <ResidentGate
        eyebrow="Community Board"
        title="Community Board"
        lede="Neighbors asking questions, trading tips, and looking out for each other. Conversations are for residents only."
        active="/community"
        features={[
          "Start a conversation or ask the village anything",
          "Reply to neighbors and follow what's active",
          "Friendly moderation by the HOA",
        ]}
      />
    );
  }
  const isAdmin = session.user.role === "admin";
  const { error } = await searchParams;

  const rows = await db
    .select({
      id: thread.id,
      title: thread.title,
      status: thread.status,
      createdAt: thread.createdAt,
      lastReplyAt: thread.lastReplyAt,
      authorName: user.name,
      replies: count(comment.id),
    })
    .from(thread)
    .innerJoin(user, eq(thread.userId, user.id))
    .leftJoin(
      comment,
      and(
        eq(comment.targetType, "thread"),
        eq(comment.targetId, thread.id),
        eq(comment.status, "visible")
      )
    )
    .where(isAdmin ? undefined : eq(thread.status, "visible"))
    .groupBy(thread.id, user.name)
    .orderBy(desc(thread.lastReplyAt))
    .limit(50);

  return (
    <>
      <SiteHeader signedIn isAdmin={session.user.role === "admin"} active="/community" />
      <main className="board-main board-wide">
        <p className="eyebrow">Residents Only</p>
        <h1 className="section-title">Community Board</h1>
        <p className="board-lede">
          Start a conversation, ask a question, borrow a ladder, report a
          javelina. Every topic belongs to the whole village.
        </p>

        <details className="new-topic" open={!!error}>
          <summary>
            <span>Start a conversation</span>
            <span className="new-topic-glyph" aria-hidden="true">
              +
            </span>
          </summary>
          <form action={createThread}>
            {error && ERRORS[error] && (
              <p className="auth-error">{ERRORS[error]}</p>
            )}
            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                maxLength={120}
                required
                placeholder="What would you like to talk about?"
              />
            </div>
            <textarea
              className="board-input"
              name="body"
              maxLength={5000}
              required
              placeholder="Say more about it"
              aria-label="Your post"
            />
            <div className="board-form-foot">
              <span className="posting-as">Posting as {session.user.name}</span>
              <button className="btn" type="submit">
                Post Topic
              </button>
            </div>
          </form>
        </details>

        {rows.length === 0 ? (
          <p className="board-empty">
            No conversations yet — be the first to start one.
          </p>
        ) : (
          <div className="thread-list">
            {rows.map((t) => (
              <a className="thread-row" href={`/community/${t.id}`} key={t.id}>
                <div>
                  <h3 className="thread-title">
                    {t.title}
                    {t.status === "hidden" && <span className="pill">Hidden</span>}
                  </h3>
                  <p className="thread-meta">
                    Started by {t.authorName} · {dateFmt.format(t.createdAt)}
                  </p>
                </div>
                <div className="thread-replies">
                  <span className="thread-count">{t.replies}</span>
                  <span className="thread-count-label">
                    {t.replies === 1 ? "reply" : "replies"}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
      <SiteFooter signedIn />
    </>
  );
}
