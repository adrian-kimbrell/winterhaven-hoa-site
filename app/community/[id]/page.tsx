import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comment, thread } from "@/lib/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  createReply,
  deleteOwnReply,
  deleteOwnThread,
  setReplyHidden,
  setThreadHidden,
} from "../actions";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Phoenix",
});

const ERRORS: Record<string, string> = {
  "body-empty": "Write something first — your neighbors are listening.",
  "body-toolong": "Replies are capped at 2,000 characters.",
  cooldown: "You're replying quickly — give it half a minute and try again.",
};

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const isAdmin = session.user.role === "admin";
  const { id } = await params;
  const { error } = await searchParams;

  const topic = await db.query.thread.findFirst({
    where: eq(thread.id, id),
    with: { author: true },
  });
  if (!topic || (topic.status === "hidden" && !isAdmin)) notFound();

  const replies = await db.query.comment.findMany({
    where: isAdmin
      ? and(eq(comment.targetType, "thread"), eq(comment.targetId, id))
      : and(
          eq(comment.targetType, "thread"),
          eq(comment.targetId, id),
          eq(comment.status, "visible")
        ),
    with: { author: true },
    orderBy: [asc(comment.createdAt)],
    limit: 200,
  });

  const mine = topic.userId === session.user.id;
  const topicHidden = topic.status === "hidden";

  return (
    <>
      <SiteHeader signedIn />
      <main className="board-main">
        <a className="text-link thread-back" href="/community">
          All conversations
        </a>
        <article className={`thread-post${topicHidden ? " comment-hidden" : ""}`}>
          <h1 className="section-title thread-post-title">
            {topic.title}
            {topicHidden && <span className="pill">Hidden</span>}
          </h1>
          <div className="comment-head">
            <span className="comment-author">{topic.author.name}</span>
            <span className="comment-date">{dateFmt.format(topic.createdAt)}</span>
          </div>
          <p className="thread-body">{topic.body}</p>
          {(mine || isAdmin) && (
            <div className="comment-actions">
              {mine && replies.length === 0 && (
                <form action={deleteOwnThread.bind(null, topic.id)}>
                  <button className="comment-action-btn" type="submit">
                    Delete
                  </button>
                </form>
              )}
              {isAdmin && (
                <form action={setThreadHidden.bind(null, topic.id, !topicHidden)}>
                  <button className="comment-action-btn" type="submit">
                    {topicHidden ? "Unhide" : "Hide"}
                  </button>
                </form>
              )}
            </div>
          )}
        </article>

        <h2 className="replies-head">
          {replies.length === 0
            ? "No replies yet"
            : replies.length === 1
              ? "1 Reply"
              : `${replies.length} Replies`}
        </h2>
        {replies.length > 0 && (
          <div className="comment-list">
            {replies.map((r) => {
              const hidden = r.status === "hidden";
              const own = r.userId === session.user.id;
              return (
                <article
                  key={r.id}
                  className={`comment-item${hidden ? " comment-hidden" : ""}`}
                >
                  <div className="comment-head">
                    <span className="comment-author">{r.author.name}</span>
                    <span className="comment-date">
                      {dateFmt.format(r.createdAt)}
                    </span>
                    {hidden && <span className="pill">Hidden</span>}
                  </div>
                  <p className="comment-body">{r.body}</p>
                  {(own || isAdmin) && (
                    <div className="comment-actions">
                      {own && (
                        <form action={deleteOwnReply.bind(null, r.id, topic.id)}>
                          <button className="comment-action-btn" type="submit">
                            Delete
                          </button>
                        </form>
                      )}
                      {isAdmin && (
                        <form
                          action={setReplyHidden.bind(null, r.id, topic.id, !hidden)}
                        >
                          <button className="comment-action-btn" type="submit">
                            {hidden ? "Unhide" : "Hide"}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <form className="board-form" action={createReply.bind(null, topic.id)}>
          {error && ERRORS[error] && <p className="auth-error">{ERRORS[error]}</p>}
          <textarea
            className="board-input"
            name="body"
            maxLength={2000}
            required
            placeholder="Write a reply"
            aria-label="Your reply"
          />
          <div className="board-form-foot">
            <span className="posting-as">Replying as {session.user.name}</span>
            <button className="btn" type="submit">
              Post Reply
            </button>
          </div>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
