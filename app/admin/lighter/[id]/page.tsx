import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { lighterPost } from "@/lib/schema";
import { IMAGE_ACCEPT } from "@/lib/uploads";
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
import { deleteLighterPost, saveLighterPost } from "../actions";

const ERRORS: Record<string, string> = {
  title: "Every piece needs a headline (up to 300 characters).",
  photo: "Photos must be JPEG, PNG, or WebP images.",
};

export default async function EditLighterPage({
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
    : await db.query.lighterPost.findFirst({ where: eq(lighterPost.id, id) });
  if (!isNew && !post) notFound();

  return (
    <>
      <EditorHead
        back="/admin/lighter"
        backLabel="All pieces"
        eyebrow="The Lighter Side"
        title={isNew ? "New Piece" : "Edit Piece"}
        status={post?.status}
      />
      <Flash saved={saved} error={error} errors={ERRORS} />
      <form
        className="board-form editor-form"
        action={saveLighterPost.bind(null, post?.id ?? null)}
      >
        <TextArea
          name="title"
          label="Headline or quip"
          max={300}
          rows={2}
          required
          defaultValue={post?.title}
          help="Shown large and in italics on the homepage."
        />
        <TextArea
          name="body"
          label="Column text"
          max={10000}
          rows={10}
          defaultValue={post?.body}
          help="Optional. Separate paragraphs with a blank line. Web and email addresses become links on their own; to link words, write [the words](https://address)."
        />
        <TextField
          name="note"
          label="Small print"
          max={160}
          defaultValue={post?.note}
          placeholder="Captions close Friday."
        />
        <div className="profile-grid">
          <FileField
            name="image"
            label="Photo"
            accept={IMAGE_ACCEPT}
            currentUrl={blobPreview(post?.imageKey)}
            removable
            help="For a caption contest, this is the photo to caption."
          />
          <TextField
            name="imageAlt"
            label="Photo description"
            max={200}
            defaultValue={post?.imageAlt}
          />
        </div>
        <label className="check-row optin-row">
          <input
            type="checkbox"
            name="allowComments"
            defaultChecked={post?.allowComments ?? true}
          />
          <span>
            <strong>Allow comments.</strong> Residents can reply — or enter
            captions, for a caption contest.
          </span>
        </label>
        <div className="board-form-foot">
          {post?.status === "published" ? (
            <a className="text-link" href={`/lighter/${post.id}`}>
              View on site
            </a>
          ) : (
            <span className="posting-as">Drafts are visible only to admins.</span>
          )}
          <PublishButtons status={post?.status} />
        </div>
      </form>
      {post && <DeleteForm action={deleteLighterPost.bind(null, post.id)} what="piece" />}
    </>
  );
}
