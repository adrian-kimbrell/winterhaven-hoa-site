import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { boardMember } from "@/lib/schema";
import { IMAGE_ACCEPT } from "@/lib/uploads";
import {
  DeleteForm,
  EditorHead,
  FileField,
  Flash,
  TextArea,
  TextField,
  blobPreview,
} from "@/components/admin/editor";
import { deleteBoardMember, saveBoardMember } from "../../actions";

const ERRORS: Record<string, string> = {
  name: "Every board member needs a name.",
  photo: "Photos must be JPEG, PNG, or WebP images.",
};

export default async function EditBoardMemberPage({
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
  const m = isNew
    ? null
    : await db.query.boardMember.findFirst({ where: eq(boardMember.id, id) });
  if (!isNew && !m) notFound();

  return (
    <>
      <EditorHead
        back="/admin/board"
        backLabel="Board updates"
        eyebrow="Board Members"
        title={isNew ? "Add Board Member" : m!.name}
      />
      <Flash saved={saved} error={error} errors={ERRORS} />
      <form
        className="board-form editor-form"
        action={saveBoardMember.bind(null, m?.id ?? null)}
      >
        <div className="profile-grid">
          <TextField name="name" label="Name" max={120} required defaultValue={m?.name} />
          <TextField
            name="position"
            label="Position"
            max={80}
            defaultValue={m?.position}
            placeholder="President"
          />
          <TextField name="email" label="Email" type="email" max={200} defaultValue={m?.email} />
          <TextField name="phone" label="Phone" type="tel" max={40} defaultValue={m?.phone} />
        </div>
        <TextArea name="bio" label="Bio" max={4000} rows={6} defaultValue={m?.bio} />
        <div className="profile-grid">
          <FileField
            name="photo"
            label="Photo"
            accept={IMAGE_ACCEPT}
            currentUrl={blobPreview(m?.photoKey)}
            removable
          />
          <TextField
            name="sortOrder"
            label="Display order"
            type="number"
            max={4}
            defaultValue={String(m?.sortOrder ?? 0)}
            help="Lower numbers appear first."
          />
        </div>
        <div className="board-form-foot">
          <span className="posting-as">Changes appear on the Board page right away.</span>
          <button className="btn" type="submit">
            Save Member
          </button>
        </div>
      </form>
      {m && <DeleteForm action={deleteBoardMember.bind(null, m.id)} what="board member" />}
    </>
  );
}
