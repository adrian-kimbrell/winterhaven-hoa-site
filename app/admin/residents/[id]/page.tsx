import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { dateFmt } from "@/lib/content";
import { EditorHead, Flash, TextField } from "@/components/admin/editor";
import { ResetPasswordForm } from "@/components/admin/password-forms";
import {
  removeResident,
  resetPassword,
  setSuspended,
  updateResident,
} from "../actions";

const ERRORS: Record<string, string> = {
  details: "Enter a name and a valid email address.",
  "email-taken": "Another account already uses that email address.",
  "self-demote": "You can't remove your own administrator access.",
  self: "You can't suspend or remove your own account.",
  confirm: "Tick the box to confirm the removal.",
};

const SAVED: Record<string, string> = {
  "1": "Saved.",
  suspended: "Account suspended — they can no longer sign in.",
  restored: "Account restored — they can sign in again.",
};

export default async function ManageResidentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  const { saved, error } = await searchParams;
  const person = await db.query.user.findFirst({
    where: eq(user.id, id),
    with: { profile: true },
  });
  if (!person) notFound();
  const isSelf = person.id === session.user.id;

  return (
    <>
      <EditorHead
        back="/admin/residents"
        backLabel="All residents"
        eyebrow="Residents & Accounts"
        title={person.name}
      />
      <p className="admin-lede">
        Joined {dateFmt.format(person.createdAt)}
        {person.banned ? " · Suspended" : ""}
        {person.profile?.optIn ? " · Listed in the directory" : " · Not in the directory"}
      </p>
      {saved && SAVED[saved] && <p className="save-note">{SAVED[saved]}</p>}
      <Flash error={error} errors={ERRORS} />

      <form className="board-form editor-form" action={updateResident.bind(null, person.id)}>
        <div className="profile-grid">
          <TextField name="name" label="Name" max={120} required defaultValue={person.name} />
          <TextField
            name="email"
            label="Email (used to sign in)"
            type="email"
            max={200}
            required
            defaultValue={person.email}
          />
        </div>
        <div className="field">
          <span className="field-label">Access</span>
          <div className="radio-row">
            <label className="check-row">
              <input
                type="radio"
                name="role"
                value="resident"
                defaultChecked={person.role !== "admin"}
                disabled={isSelf}
              />{" "}
              Resident
            </label>
            <label className="check-row">
              <input
                type="radio"
                name="role"
                value="admin"
                defaultChecked={person.role === "admin"}
              />{" "}
              Administrator
            </label>
          </div>
        </div>
        <div className="board-form-foot">
          <a className="text-link" href={`/profile?for=${person.id}`}>
            Edit directory profile
          </a>
          <button className="btn" type="submit">
            Save Changes
          </button>
        </div>
      </form>

      <div className="admin-panels">
        <section className="admin-panel">
          <h2 className="replies-head">Password</h2>
          <ResetPasswordForm action={resetPassword.bind(null, person.id)} />
        </section>
        {!isSelf && (
          <section className="admin-panel">
            <h2 className="replies-head">
              {person.banned ? "Suspended" : "Suspend Access"}
            </h2>
            <p className="field-help field-help-block">
              {person.banned
                ? "This resident cannot sign in. Their posts and profile are kept."
                : "Blocks sign-in without deleting anything. Reversible."}
            </p>
            <form action={setSuspended.bind(null, person.id, !person.banned)}>
              <button className="btn btn-quiet" type="submit">
                {person.banned ? "Restore Access" : "Suspend"}
              </button>
            </form>
          </section>
        )}
      </div>

      {!isSelf && (
        <form className="danger-zone" action={removeResident.bind(null, person.id)}>
          <h2 className="replies-head">Remove Account</h2>
          <label className="check-row">
            <input type="checkbox" name="confirm" required /> Permanently delete
            this account, their directory profile, pets, photos, and every post
            and reply they wrote. This cannot be undone.
          </label>
          <button className="btn btn-danger" type="submit">
            Remove Account
          </button>
        </form>
      )}
    </>
  );
}
