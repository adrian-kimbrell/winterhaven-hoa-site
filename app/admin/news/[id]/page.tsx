import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { newsStory } from "@/lib/schema";
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
import { deleteStory, saveStory } from "../actions";

const ERRORS: Record<string, string> = {
  title: "Every story needs a title (up to 160 characters).",
  photo: "Photos must be JPEG, PNG, or WebP images.",
};

export default async function EditStoryPage({
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
  const story = isNew
    ? null
    : await db.query.newsStory.findFirst({ where: eq(newsStory.id, id) });
  if (!isNew && !story) notFound();

  return (
    <>
      <EditorHead
        back="/admin/news"
        backLabel="All stories"
        eyebrow="Community News"
        title={isNew ? "New Story" : "Edit Story"}
        status={story?.status}
      />
      <Flash saved={saved} error={error} errors={ERRORS} />
      <form className="board-form editor-form" action={saveStory.bind(null, story?.id ?? null)}>
        <TextField name="title" label="Headline" max={160} required defaultValue={story?.title} />
        <div className="profile-grid">
          <TextField
            name="kicker"
            label="Kicker"
            max={60}
            defaultValue={story?.kicker}
            placeholder="Begins Monday"
            help="A short line above the headline — a date, or a word like “Now blooming.”"
          />
          <label className="check-row check-row-field">
            <input type="checkbox" name="pinned" defaultChecked={story?.pinned ?? false} />
            <span>
              <strong>Lead story.</strong> Shows large at the top of the
              homepage news, whatever its date.
            </span>
          </label>
        </div>
        <TextArea
          name="summary"
          label="Summary"
          max={400}
          rows={3}
          defaultValue={story?.summary}
          help="One or two sentences for the homepage. Leave empty to use the start of the story."
        />
        <TextArea
          name="body"
          label="Full story"
          max={20000}
          rows={12}
          defaultValue={story?.body}
          help="Separate paragraphs with a blank line. Web and email addresses become links on their own; to link words, write [the words](https://address)."
        />
        <div className="profile-grid">
          <FileField
            name="image"
            label="Photo"
            accept={IMAGE_ACCEPT}
            currentUrl={blobPreview(story?.imageKey)}
            removable
            help="JPEG, PNG, or WebP. Large photos are resized automatically."
          />
          <TextField
            name="imageAlt"
            label="Photo description"
            max={200}
            defaultValue={story?.imageAlt}
            help="Describe the photo for screen readers."
          />
        </div>
        <div className="board-form-foot">
          {story?.status === "published" ? (
            <a className="text-link" href={`/news/${story.id}`}>
              View on site
            </a>
          ) : (
            <span className="posting-as">Drafts are visible only to admins.</span>
          )}
          <PublishButtons status={story?.status} />
        </div>
      </form>
      {story && <DeleteForm action={deleteStory.bind(null, story.id)} what="story" />}
    </>
  );
}
