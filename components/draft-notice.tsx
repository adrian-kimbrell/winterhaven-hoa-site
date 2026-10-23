/* Admins can open drafts on the live site to preview them. */
export function DraftNotice({
  status,
  isAdmin,
  editHref,
}: {
  status: string;
  isAdmin: boolean;
  editHref: string;
}) {
  if (!isAdmin) return null;
  return (
    <p className={status === "published" ? "admin-strip" : "auth-error"}>
      {status === "published"
        ? "You are viewing this as an administrator. "
        : "Draft preview — residents cannot see this yet. "}
      <a href={editHref}>Edit</a>
    </p>
  );
}
