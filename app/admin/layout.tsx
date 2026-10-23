import { requireAdmin } from "@/lib/admin";
import { SignOutButton } from "@/components/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  return (
    <div className="admin-page">
      <div className="admin-top">
        <div className="admin-bar">
          <a className="wordmark" href="/">
            Winterhaven Village
          </a>
          <div className="admin-bar-right">
            <a className="admin-bar-link" href="/">
              View site
            </a>
            <span className="admin-user">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
        <AdminNav />
      </div>
      <main className="admin-main">{children}</main>
    </div>
  );
}
