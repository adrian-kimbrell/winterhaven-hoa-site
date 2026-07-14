import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pet, profile, user as userTable } from "@/lib/schema";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { addPet, deletePet, saveProfile } from "./actions";

const ERRORS: Record<string, string> = {
  photo: "Photos must be JPEG, PNG, or WebP and no larger than 5 MB.",
  length: "One of the fields is longer than allowed — trim it a little.",
  "pet-name": "Every pet needs at least a name.",
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
      <SiteHeader signedIn />
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
        {params.saved && <p className="save-note">Profile saved.</p>}
        {params.error && ERRORS[params.error] && (
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
                  src={`/api/photos/${existing.photoKey}`}
                  alt="Current portrait"
                />
              )}
              <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
            </div>
            <div className="field">
              <label htmlFor="residencePhoto">Photo of Residence</label>
              {existing?.residencePhotoKey && (
                <img
                  className="current-photo current-photo-wide"
                  src={`/api/photos/${existing.residencePhotoKey}`}
                  alt="Current residence photo"
                />
              )}
              <input
                id="residencePhoto"
                name="residencePhoto"
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
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
                    src={`/api/photos/${p.photoKey}`}
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
            <input id="pet-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
          </div>
          <div className="board-form-foot">
            <span className="posting-as">Pets appear on the directory page.</span>
            <button className="btn" type="submit">
              Add Pet
            </button>
          </div>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
