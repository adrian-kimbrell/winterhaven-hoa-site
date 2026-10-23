import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { boardPost } from "@/lib/schema";
import { DOCUMENT_ACCEPT, blobUrl } from "@/lib/uploads";
import {
  DeleteForm,
  EditorHead,
  FileField,
  Flash,
  PublishButtons,
  TextArea,
  TextField,
  blobPreview,
} from "@/components/admin/editor";
import { deleteBoardPost, saveBoardPost } from "../../actions";

const ERRORS: Record<string, string> = {
  title: "Every post needs a title (up to 160 characters).",
  document: "Documents must be a PDF or an image, no larger than 4 MB.",
};

export default async function EditBoardPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { saved, error } = await searchParams;
  const isNew = id === "new";
  const post = isNew
    ? null
    : await db.query.boardPost.findFirst({ where: eq(boardPost.id, id) });
  if (!isNew && !post) notFound();

  return (
    <>
      <EditorHead
        back="/admin/board"
        backLabel="Board updates"
        eyebrow="From the Board"
        title={isNew ? "New Post" : "Edit Post"}
        status={post?.status}
      />
      <Flash saved={saved} error={error} errors={ERRORS} />
      <form
        className="board-form editor-form"
        action={saveBoardPost.bind(null, post?.id ?? null)}
      >
        <div className="field">
          <span className="field-label">Type</span>
          <div className="radio-row">
            <label className="check-row">
              <input
                type="radio"
                name="kind"
                value="update"
                defaultChecked={post?.kind !== "minutes"}
              />
              Project update
            </label>
            <label className="check-row">
              <input
                type="radio"
                name="kind"
                value="minutes"
                defaultChecked={post?.kind === "minutes"}
              />
              Meeting minutes
            </label>
          </div>
        </div>
        <div className="profile-grid">
          <TextField name="title" label="Title" max={160} required defaultValue={post?.title} />
          <TextField
            name="meetingDate"
            label="Meeting date"
            type="date"
            max={10}
            defaultValue={post?.meetingDate}
            help="For minutes — the date the board met."
          />
        </div>
        <TextArea
          name="body"
          label="Text"
          max={20000}
          rows={10}
          defaultValue={post?.body}
          help="A summary or the full text. Separate paragraphs with a blank line. Web and email addresses become links on their own; to link words, write [the words](https://address)."
        />
        <FileField
          name="document"
          label="Attached document"
          accept={DOCUMENT_ACCEPT}
          currentUrl={post?.documentKey ? blobUrl(post.documentKey) : null}
          currentLabel={post?.documentName ?? "Current document"}
          removable
          help="PDF or image, up to 4 MB. Residents can open it from the Board page."
        />
        <div className="board-form-foot">
          {post?.status === "published" ? (
            <a className="text-link" href={`/board#post-${post.id}`}>
              View on site
            </a>
          ) : (
            <span className="posting-as">Drafts are visible only to admins.</span>
          )}
          <PublishButtons status={post?.status} />
        </div>
      </form>
      {post && <DeleteForm action={deleteBoardPost.bind(null, post.id)} what="post" />}
    </>
  );
}
