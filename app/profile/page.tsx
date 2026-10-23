import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pet, profile, user as userTable } from "@/lib/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UploadInput } from "@/components/upload-input";
import { IMAGE_ACCEPT, blobUrl } from "@/lib/uploads";
import { addPet, changePassword, deletePet, saveProfile } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile" };

const ERRORS: Record<string, string> = {
  name: "Your name can't be blank.",
  photo: "Photos must be JPEG, PNG, or WebP images.",
  length: "One of the fields is longer than allowed — trim it a little.",
  "pet-name": "Every pet needs at least a name.",
  "password-current": "Your current password wasn't right.",
  "password-length": "New passwords need at least 10 characters.",
  "password-match": "The two new passwords don't match.",
};

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string; error?: string; saved?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const params = await searchParams;
  const isAdmin = session.user.role === "admin";

  const targetId =
    params.for && isAdmin && params.for !== "" ? params.for : session.user.id;
  const editingOther = targetId !== session.user.id;

  const target = editingOther
    ? await db.query.user.findFirst({ where: eq(userTable.id, targetId) })
    : session.user;
  if (!target) redirect("/admin");

  const existing = await db.query.profile.findFirst({
    where: eq(profile.userId, targetId),
  });
  const pets = await db.query.pet.findMany({
    where: eq(pet.userId, targetId),
    orderBy: [asc(pet.createdAt)],
  });
  const forField = editingOther ? (
    <input type="hidden" name="for" value={targetId} />
  ) : null;

  return (
    <>
      <SiteHeader signedIn isAdmin={session.user.role === "admin"} active="/profile" />
      <main className="board-main">
        <p className="eyebrow">Resident Directory</p>
        <h1 className="section-title">
          {editingOther ? `${target.name}'s Profile` : "My Profile"}
        </h1>
        <p className="board-lede">
          Share as much or as little as you like — only what you fill in
          appears in the directory, and only for signed-in neighbors.
        </p>
        {editingOther && (
          <p className="auth-error">
            You are editing {target.name}&rsquo;s profile as an administrator.
          </p>
        )}
        {params.saved && params.saved !== "password" && (
          <p className="save-note">Profile saved.</p>
        )}
        {params.error && ERRORS[params.error] && !params.error.startsWith("password") && (
          <p className="auth-error">{ERRORS[params.error]}</p>
        )}

        <form className="board-form profile-form" action={saveProfile}>
          {forField}
          <label className="optin-row">
            <input
              type="checkbox"
              name="optIn"
              defaultChecked={existing?.optIn ?? false}
            />
            <span>
              <strong>List {editingOther ? "this profile" : "me"} in the
              directory.</strong>{" "}
              Until this is on, nothing here is visible to anyone else.
            </span>
          </label>

          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={80}
              required
              defaultValue={target.name}
              placeholder="Pat and Chris Rivera"
            />
            <p className="field-help">
              How you appear in the directory, on posts, and in comments.
            </p>
          </div>

          <div className="profile-grid">
            <div className="field">
              <label htmlFor="unit">Address / Unit</label>
              <input
                id="unit"
                name="unit"
                type="text"
                maxLength={80}
                defaultValue={existing?.unit ?? ""}
                placeholder="12 Ocotillo Court"
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                maxLength={40}
                defaultValue={existing?.phone ?? ""}
                placeholder="(555) 012-3847"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="bio">Short Bio</label>
            <textarea
              className="board-input"
              id="bio"
              name="bio"
              maxLength={2000}
              defaultValue={existing?.bio ?? ""}
              placeholder="A paragraph about you and yours"
            />
          </div>
          <div className="field">
            <label htmlFor="facts">Interesting Facts</label>
            <textarea
              className="board-input"
              id="facts"
              name="facts"
              maxLength={2000}
              defaultValue={existing?.facts ?? ""}
              placeholder="Ran a bakery for twenty years. Once shook hands with a president. Makes a legendary green chile stew."
            />
          </div>

          <div className="profile-grid">
            <div className="field">
              <label htmlFor="photo">Portrait Photo</label>
              {existing?.photoKey && (
                <img
                  className="current-photo"
                  src={blobUrl(existing.photoKey, 320)}
                  alt="Current portrait"
                />
              )}
              <UploadInput id="photo" name="photo" accept={IMAGE_ACCEPT} />
            </div>
            <div className="field">
              <label htmlFor="residencePhoto">Photo of Residence</label>
              {existing?.residencePhotoKey && (
                <img
                  className="current-photo current-photo-wide"
                  src={blobUrl(existing.residencePhotoKey, 320)}
                  alt="Current residence photo"
                />
              )}
              <UploadInput id="residencePhoto" name="residencePhoto" accept={IMAGE_ACCEPT} />
            </div>
          </div>

          <div className="board-form-foot">
            <a className="text-link" href={`/directory/${targetId}`}>
              Preview directory page
            </a>
            <button className="btn" type="submit">
              Save Profile
            </button>
          </div>
        </form>

        <h2 className="replies-head">Pets</h2>
        {pets.length === 0 ? (
          <p className="board-empty">No pets listed yet.</p>
        ) : (
          <div className="pet-rows">
            {pets.map((p) => (
              <div className="pet-row" key={p.id}>
                {p.photoKey ? (
                  <img
                    className="pet-thumb"
                    src={blobUrl(p.photoKey, 160)}
                    alt={p.name}
                  />
                ) : (
                  <div className="pet-thumb pet-thumb-empty" aria-hidden="true">
                    {p.name[0]}
                  </div>
                )}
                <div className="pet-row-info">
                  <span className="pet-name">{p.name}</span>
                  {p.species && <span className="pet-species">{p.species}</span>}
                </div>
                <form action={deletePet.bind(null, p.id)}>
                  <button className="comment-action-btn" type="submit">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <form className="board-form" action={addPet}>
          {forField}
          <div className="profile-grid">
            <div className="field">
              <label htmlFor="pet-name">Pet Name</label>
              <input id="pet-name" name="name" type="text" maxLength={60} required placeholder="Biscuit" />
            </div>
            <div className="field">
              <label htmlFor="pet-species">Breed / Species</label>
              <input id="pet-species" name="species" type="text" maxLength={60} placeholder="Pembroke Welsh Corgi" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="pet-photo">Pet Photo</label>
            <UploadInput id="pet-photo" name="photo" accept={IMAGE_ACCEPT} />
          </div>
          <div className="board-form-foot">
            <span className="posting-as">Pets appear on the directory page.</span>
            <button className="btn" type="submit">
              Add Pet
            </button>
          </div>
        </form>

        {!editingOther && (
          <section id="password">
            <h2 className="replies-head">Change Password</h2>
            {params.saved === "password" && (
              <p className="save-note">
                Password changed. Other devices have been signed out.
              </p>
            )}
            {params.error?.startsWith("password") && ERRORS[params.error] && (
              <p className="auth-error">{ERRORS[params.error]}</p>
            )}
            <form className="board-form" action={changePassword}>
              <div className="field">
                <label htmlFor="currentPassword">Current password</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="profile-grid">
                <div className="field">
                  <label htmlFor="newPassword">New password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={10}
                    maxLength={128}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="confirmPassword">New password, again</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={10}
                    maxLength={128}
                    required
                  />
                </div>
              </div>
              <div className="board-form-foot">
                <span className="posting-as">At least 10 characters.</span>
                <button className="btn" type="submit">
                  Change Password
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
