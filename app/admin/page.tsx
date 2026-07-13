import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

const MODULES = [
  {
    title: "Community News",
    desc: "Post and edit the weekly news items shown on the homepage.",
  },
  {
    title: "The Lighter Side",
    desc: "Manage the humor column and caption contests.",
  },
  {
    title: "Board Updates & Minutes",
    desc: "Publish meeting minutes and project updates.",
  },
  {
    title: "CC&R Corner",
    desc: "Post the question of the week and curate answers.",
  },
  {
    title: "Residents & Invites",
    desc: "Invite residents, manage accounts, and reset access.",
  },
  {
    title: "Community Board",
    desc: "Moderate the public comment board.",
  },
];

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  return (
    <div className="admin-page">
      <div className="admin-bar">
        <a className="wordmark" href="/">
          Winterhaven Village
        </a>
        <div className="admin-bar-right">
          <span className="admin-user">{session.user.email}</span>
          <SignOutButton />
        </div>
      </div>
      <main className="admin-main">
        <p className="eyebrow">Administration</p>
        <h1 className="section-title">Site Management</h1>
        <p className="admin-lede">
          Everything on the site — news, columns, minutes, the directory — is
          managed from here. Modules light up as they are built.
        </p>
        <div className="admin-grid">
          {MODULES.map((m) => (
            <div className="admin-card" key={m.title}>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
              <span className="pill">Coming next</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
