import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { comment } from "@/lib/schema";
import {
  type CommentTarget,
  deleteOwnComment,
  postComment,
  setCommentHidden,
} from "@/app/comments/actions";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Phoenix",
});

const ERRORS: Record<string, string> = {
  body: "Write something first (up to 2,000 characters).",
  cooldown: "You're commenting quickly — give it half a minute and try again.",
};

export async function CommentSection({
  type,
  targetId,
  viewer,
  open = true,
  heading = "Comments",
  noun = "comment",
  error,
}: {
  type: CommentTarget;
  targetId: string;
  viewer: { id: string; name: string; role?: string | null };
  open?: boolean;
  heading?: string;
  noun?: string;
  error?: string;
}) {
  const isAdmin = viewer.role === "admin";
  const items = await db.query.comment.findMany({
    where: and(
      eq(comment.targetType, type),
      eq(comment.targetId, targetId),
      isAdmin ? undefined : eq(comment.status, "visible")
    ),
    with: { author: true },
    orderBy: [asc(comment.createdAt)],
    limit: 300,
  });

  return (
    <section id="comments" className="comments">
      <h2 className="replies-head">
        {items.length === 0 ? heading : `${heading} (${items.length})`}
      </h2>
      {items.length === 0 ? (
        <p className="comment-empty">
          {open ? `No ${noun}s yet — be the first.` : `No ${noun}s.`}
        </p>
      ) : (
        <div className="comment-list">
          {items.map((c) => {
            const hidden = c.status === "hidden";
            const own = c.userId === viewer.id;
            return (
              <article key={c.id} className={`comment-item${hidden ? " comment-hidden" : ""}`}>
                <div className="comment-head">
                  <span className="comment-author">{c.author.name}</span>
                  <span className="comment-date">{dateFmt.format(c.createdAt)}</span>
                  {hidden && <span className="pill">Hidden</span>}
                </div>
                <p className="comment-body">{c.body}</p>
                {((own && !hidden) || isAdmin) && (
                  <div className="comment-actions">
                    {own && !hidden && (
                      <form action={deleteOwnComment.bind(null, type, targetId, c.id)}>
                        <button className="comment-action-btn" type="submit">
                          Delete
                        </button>
                      </form>
                    )}
                    {isAdmin && (
                      <form action={setCommentHidden.bind(null, type, targetId, c.id, !hidden)}>
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
      {open && (
        <form className="board-form" action={postComment.bind(null, type, targetId)}>
          {error && ERRORS[error] && <p className="auth-error">{ERRORS[error]}</p>}
          <textarea
            className="board-input"
            name="body"
            maxLength={2000}
            required
            placeholder={`Add a ${noun}`}
            aria-label={`Your ${noun}`}
          />
          <div className="board-form-foot">
            <span className="posting-as">Posting as {viewer.name}</span>
            <button className="btn" type="submit">
              Post
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
