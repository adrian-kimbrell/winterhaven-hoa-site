import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comment } from "@/lib/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { postComment, deleteOwnComment, setCommentHidden } from "./actions";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Phoenix",
});

const ERRORS: Record<string, string> = {
  empty: "Write something first — the board is listening.",
  toolong: "Comments are capped at 2,000 characters.",
  cooldown: "You're posting quickly — give it half a minute and try again.",
};

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const isAdmin = session.user.role === "admin";
  const { error } = await searchParams;

  const rows = await db.query.comment.findMany({
    where: isAdmin
      ? eq(comment.targetType, "board")
      : and(eq(comment.targetType, "board"), eq(comment.status, "visible")),
    with: { author: true },
    orderBy: [desc(comment.createdAt)],
    limit: 100,
  });

  return (
    <>
      <SiteHeader signedIn />
      <main className="board-main">
        <p className="eyebrow">Residents Only</p>
        <h1 className="section-title">Community Board</h1>
        <p className="board-lede">
          Say hello, ask a question, borrow a ladder, report a javelina. This
          board belongs to everyone at Winterhaven Village.
        </p>

        <form className="board-form" action={postComment}>
          {error && ERRORS[error] && <p className="auth-error">{ERRORS[error]}</p>}
          <textarea
            className="board-input"
            name="body"
            maxLength={2000}
            required
            placeholder="Share something with your neighbors"
            aria-label="Your comment"
          />
          <div className="board-form-foot">
            <span className="posting-as">
              Posting as {session.user.name}
            </span>
            <button className="btn" type="submit">
              Post Comment
            </button>
          </div>
        </form>

        {rows.length === 0 ? (
          <p className="board-empty">
            Nothing here yet — be the first to say hello.
          </p>
        ) : (
          <div className="comment-list">
            {rows.map((c) => {
              const hidden = c.status === "hidden";
              const mine = c.userId === session.user.id;
              return (
                <article
                  key={c.id}
                  className={`comment-item${hidden ? " comment-hidden" : ""}`}
                >
                  <div className="comment-head">
                    <span className="comment-author">{c.author.name}</span>
                    <span className="comment-date">
                      {dateFmt.format(c.createdAt)}
                    </span>
                    {hidden && <span className="pill">Hidden</span>}
                  </div>
                  <p className="comment-body">{c.body}</p>
                  {(mine || isAdmin) && (
                    <div className="comment-actions">
                      {mine && (
                        <form action={deleteOwnComment.bind(null, c.id)}>
                          <button className="comment-action-btn" type="submit">
                            Delete
                          </button>
                        </form>
                      )}
                      {isAdmin && (
                        <form
                          action={setCommentHidden.bind(null, c.id, !hidden)}
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
      </main>
      <SiteFooter />
    </>
  );
}
