import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { dateFmt } from "@/lib/content";

export default async function AdminResidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ removed?: string }>;
}) {
  await requireAdmin();
  const { removed } = await searchParams;
  const people = await db.query.user.findMany({
    orderBy: [asc(user.name)],
    with: { profile: true },
  });

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Residents &amp; Accounts</p>
          <h1 className="section-title">Residents</h1>
          <p className="admin-lede">
            Everyone who can sign in. Add residents, reset forgotten
            passwords, and edit profiles on a neighbor&rsquo;s behalf.
          </p>
        </div>
        <a className="btn" href="/admin/residents/new">
          Add Resident
        </a>
      </div>
      {removed && <p className="save-note">Account removed.</p>}
      <div className="thread-list">
        {people.map((p) => (
          <a className="thread-row" href={`/admin/residents/${p.id}`} key={p.id}>
            <div>
              <h2 className="thread-title">
                {p.name}
                {p.role === "admin" && <span className="pill pill-live">Admin</span>}
                {p.banned && <span className="pill">Suspended</span>}
                {p.profile?.optIn && <span className="pill">In directory</span>}
              </h2>
              <p className="thread-meta">
                {p.email} · Joined {dateFmt.format(p.createdAt)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
