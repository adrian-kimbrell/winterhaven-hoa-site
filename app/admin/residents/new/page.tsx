import { requireAdmin } from "@/lib/admin";
import { EditorHead } from "@/components/admin/editor";
import { CreateResidentForm } from "@/components/admin/password-forms";
import { createResident } from "../actions";

export default async function NewResidentPage() {
  await requireAdmin();
  return (
    <>
      <EditorHead
        back="/admin/residents"
        backLabel="All residents"
        eyebrow="Residents & Accounts"
        title="Add a Resident"
      />
      <p className="admin-lede">
        Creates a sign-in for a Winterhaven Village resident. Nothing about
        them appears in the directory until they (or you) fill in their
        profile and opt in.
      </p>
      <CreateResidentForm action={createResident} />
    </>
  );
}
