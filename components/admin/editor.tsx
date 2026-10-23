import { blobUrl } from "@/lib/uploads";
import type { Status } from "@/lib/content";
import { UploadInput } from "@/components/upload-input";

/* Building blocks shared by every admin editor. */

export function StatusPill({ status }: { status: string }) {
  return status === "published" ? (
    <span className="pill pill-live">Published</span>
  ) : (
    <span className="pill">Draft</span>
  );
}

export function Flash({
  saved,
  error,
  errors,
}: {
  saved?: string;
  error?: string;
  errors: Record<string, string>;
}) {
  return (
    <>
      {saved && (
        <p className="save-note">
          {saved === "published" ? "Published — residents can see it now." : "Saved."}
        </p>
      )}
      {error && <p className="auth-error">{errors[error] ?? "Something went wrong — try again."}</p>}
    </>
  );
}

export function TextField({
  name,
  label,
  defaultValue,
  max,
  required,
  help,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  max: number;
  required?: boolean;
  help?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        maxLength={max}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
      />
      {help && <p className="field-help">{help}</p>}
    </div>
  );
}

export function TextArea({
  name,
  label,
  defaultValue,
  max,
  required,
  help,
  rows = 6,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  max: number;
  required?: boolean;
  help?: string;
  rows?: number;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <textarea
        className="board-input"
        id={name}
        name={name}
        maxLength={max}
        required={required}
        rows={rows}
        defaultValue={defaultValue ?? ""}
      />
      {help && <p className="field-help">{help}</p>}
    </div>
  );
}

export function FileField({
  name,
  label,
  accept,
  currentUrl,
  currentLabel,
  removable,
  help,
}: {
  name: string;
  label: string;
  accept: string;
  currentUrl?: string | null;
  currentLabel?: string | null;
  removable?: boolean;
  help?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {currentUrl &&
        (currentLabel ? (
          <p className="field-current">
            <a className="text-link" href={currentUrl} target="_blank" rel="noreferrer">
              {currentLabel}
            </a>
          </p>
        ) : (
          <img className="current-photo current-photo-wide" src={currentUrl} alt="" />
        ))}
      <UploadInput
        id={name}
        name={name}
        accept={accept}
        kind={accept.includes("pdf") ? "document" : "image"}
      />
      {currentUrl && removable && (
        <label className="check-row">
          <input type="checkbox" name={`${name}Remove`} /> Remove current file
        </label>
      )}
      {help && <p className="field-help">{help}</p>}
    </div>
  );
}

export function blobPreview(key: string | null | undefined, width = 480) {
  return key ? blobUrl(key, width) : null;
}

/* Publish / save-draft buttons for content with a draft workflow. */
export function PublishButtons({ status }: { status?: Status | string }) {
  const live = status === "published";
  return (
    <div className="editor-buttons">
      <button className="btn btn-quiet" type="submit" name="intent" value="draft">
        {live ? "Unpublish" : "Save Draft"}
      </button>
      <button className="btn" type="submit" name="intent" value="publish">
        {live ? "Save & Keep Published" : "Publish"}
      </button>
    </div>
  );
}

/* Deletion needs a ticked box — the viewer has no confirm dialogs
   to lean on, and a stray click should never destroy content. */
export function DeleteForm({
  action,
  what,
}: {
  action: (formData: FormData) => Promise<void>;
  what: string;
}) {
  return (
    <form className="danger-zone" action={action}>
      <h2 className="replies-head">Delete</h2>
      <label className="check-row">
        <input type="checkbox" name="confirm" required /> Permanently delete this{" "}
        {what}. This cannot be undone.
      </label>
      <button className="btn btn-danger" type="submit">
        Delete {what}
      </button>
    </form>
  );
}

export function EditorHead({
  back,
  backLabel,
  eyebrow,
  title,
  status,
}: {
  back: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  status?: string;
}) {
  return (
    <>
      <a className="text-link thread-back" href={back}>
        {backLabel}
      </a>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="section-title thread-post-title">
        {title}
        {status && <StatusPill status={status} />}
      </h1>
    </>
  );
}
