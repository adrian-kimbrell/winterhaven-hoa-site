"use client";

import { useActionState } from "react";
import type { PasswordResult } from "@/app/admin/residents/actions";

function Issued({ result, verb }: { result: PasswordResult; verb: string }) {
  if (!result) return null;
  if (!result.ok) return <p className="auth-error">{result.error}</p>;
  return (
    <div className="issued">
      <p>
        {verb} for <strong>{result.email}</strong>. Their temporary password
        is:
      </p>
      <p className="issued-password">{result.password}</p>
      <p className="field-help">
        This is shown only once. Pass it on privately — the resident can
        change it from My Profile after signing in.
      </p>
    </div>
  );
}

export function CreateResidentForm({
  action,
}: {
  action: (prev: PasswordResult, fd: FormData) => Promise<PasswordResult>;
}) {
  const [result, formAction, pending] = useActionState(action, null);
  if (result?.ok) {
    return (
      <>
        <Issued result={result} verb="Account created" />
        <div className="editor-buttons editor-buttons-start">
          <a className="btn" href={`/admin/residents/${result.userId}`}>
            Manage Account
          </a>
          <a className="btn btn-quiet" href={`/profile?for=${result.userId}`}>
            Fill In Their Profile
          </a>
          <a className="btn btn-quiet" href="/admin/residents/new">
            Add Another
          </a>
        </div>
      </>
    );
  }
  return (
    <form className="board-form editor-form" action={formAction}>
      <Issued result={result} verb="" />
      <div className="profile-grid">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" maxLength={120} required placeholder="Margaret & Tom Ellis" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" maxLength={200} required />
        </div>
      </div>
      <div className="field">
        <span className="field-label">Access</span>
        <div className="radio-row">
          <label className="check-row">
            <input type="radio" name="role" value="resident" defaultChecked /> Resident
          </label>
          <label className="check-row">
            <input type="radio" name="role" value="admin" /> Administrator — can
            edit everything on the site
          </label>
        </div>
      </div>
      <div className="board-form-foot">
        <span className="posting-as">
          A temporary password is generated and shown on the next screen.
        </span>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Creating" : "Create Account"}
        </button>
      </div>
    </form>
  );
}

export function ResetPasswordForm({
  action,
}: {
  action: (prev: PasswordResult, fd: FormData) => Promise<PasswordResult>;
}) {
  const [result, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction}>
      <Issued result={result} verb="Password reset" />
      {!result?.ok && (
        <>
          <p className="field-help field-help-block">
            Generates a new temporary password and signs this resident out
            everywhere.
          </p>
          <button className="btn btn-quiet" type="submit" disabled={pending}>
            {pending ? "Resetting" : "Reset Password"}
          </button>
        </>
      )}
    </form>
  );
}
