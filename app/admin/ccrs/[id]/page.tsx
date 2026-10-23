import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { ccrQuestion } from "@/lib/schema";
import {
  DeleteForm,
  EditorHead,
  Flash,
  PublishButtons,
  TextArea,
  TextField,
} from "@/components/admin/editor";
import { deleteQuestion, saveQuestion } from "../actions";

const ERRORS: Record<string, string> = {
  question: "Write the question (up to 500 characters).",
};

export default async function EditQuestionPage({
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
  const q = isNew
    ? null
    : await db.query.ccrQuestion.findFirst({ where: eq(ccrQuestion.id, id) });
  if (!isNew && !q) notFound();

  return (
    <>
      <EditorHead
        back="/admin/ccrs"
        backLabel="All questions"
        eyebrow="CC&R Corner"
        title={isNew ? "New Question" : "Edit Question"}
        status={q?.status}
      />
      <Flash saved={saved} error={error} errors={ERRORS} />
      <form className="board-form editor-form" action={saveQuestion.bind(null, q?.id ?? null)}>
        <TextArea
          name="question"
          label="Resident question"
          max={500}
          rows={2}
          required
          defaultValue={q?.question}
          help="Written as the resident asked it — quotation marks are added for you."
        />
        <div className="profile-grid">
          <TextField
            name="shortAnswer"
            label="Short answer"
            max={120}
            defaultValue={q?.shortAnswer}
            placeholder="Yes, briefly."
            help="Shown in bold before the full answer."
          />
          <TextField
            name="sectionRef"
            label="CC&R reference"
            max={120}
            defaultValue={q?.sectionRef}
            placeholder="Section 4.3"
          />
        </div>
        <TextArea
          name="answer"
          label="Full answer"
          max={10000}
          rows={8}
          defaultValue={q?.answer}
          help="Plain English. Separate paragraphs with a blank line. Web and email addresses become links on their own; to link words, write [the words](https://address)."
        />
        <div className="board-form-foot">
          {q?.status === "published" ? (
            <a className="text-link" href={`/ccrs/${q.id}`}>
              View on site
            </a>
          ) : (
            <span className="posting-as">Drafts are visible only to admins.</span>
          )}
          <PublishButtons status={q?.status} />
        </div>
      </form>
      {q && <DeleteForm action={deleteQuestion.bind(null, q.id)} what="question" />}
    </>
  );
}
