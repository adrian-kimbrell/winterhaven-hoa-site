import { requireAdmin } from "@/lib/admin";
import { SETTINGS, SETTING_KEYS, getSettings, settingImageUrl } from "@/lib/site";
import { DOCUMENT_ACCEPT, IMAGE_ACCEPT, blobUrl } from "@/lib/uploads";
import { Flash } from "@/components/admin/editor";
import { UploadInput } from "@/components/upload-input";
import { saveSettings } from "./actions";

const ERRORS: Record<string, string> = {
  photo: "Photos must be JPEG, PNG, or WebP images.",
  document: "The newsletter must be a PDF (or a JPEG, PNG, or WebP image).",
  link: "One of the links isn't a web address. Links start with https:// (or www.). Nothing was saved.",
};

export default async function SiteSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const { saved, error } = await searchParams;
  const values = await getSettings();
  const groups = [...new Set(SETTING_KEYS.map((k) => SETTINGS[k].group))];

  return (
    <>
      <p className="eyebrow">Site Settings</p>
      <h1 className="section-title">Words &amp; Photos</h1>
      <p className="admin-lede">
        The mission statement, homepage copy, photos, footer, and resident
        links. Changes go live as soon as you save.
      </p>
      <Flash saved={saved} error={error} errors={ERRORS} />
      <form className="editor-form" action={saveSettings}>
        {groups.map((group) => (
          <fieldset className="board-form settings-group" key={group}>
            <legend className="replies-head">{group}</legend>
            {SETTING_KEYS.filter((k) => SETTINGS[k].group === group).map((key) => {
              const def: { label: string; help?: string; kind: string; default: string } =
                SETTINGS[key];
              const value = values[key];
              if (def.kind === "image") {
                return (
                  <div className="field" key={key}>
                    <label htmlFor={key}>{def.label}</label>
                    <img
                      className="current-photo current-photo-wide settings-photo"
                      src={settingImageUrl(value, 480)}
                      alt=""
                    />
                    <UploadInput id={key} name={key} accept={IMAGE_ACCEPT} />
                    {!value.startsWith("/") && (
                      <label className="check-row">
                        <input type="checkbox" name={`${key}Remove`} /> Go back
                        to the original photo
                      </label>
                    )}
                  </div>
                );
              }
              if (def.kind === "document") {
                return (
                  <div className="field" key={key}>
                    <label htmlFor={key}>{def.label}</label>
                    {value && (
                      <p className="field-help field-help-block">
                        A file is uploaded.{" "}
                        <a className="text-link" href={blobUrl(value)} target="_blank" rel="noopener noreferrer">
                          View it
                        </a>
                      </p>
                    )}
                    <UploadInput id={key} name={key} accept={DOCUMENT_ACCEPT} kind="document" />
                    {value && (
                      <label className="check-row">
                        <input type="checkbox" name={`${key}Remove`} /> Remove this file
                      </label>
                    )}
                    {def.help && <p className="field-help">{def.help}</p>}
                  </div>
                );
              }
              return (
                <div className="field" key={key}>
                  <label htmlFor={key}>{def.label}</label>
                  {def.kind === "link" ? (
                    <input
                      id={key}
                      name={key}
                      type="text"
                      inputMode="url"
                      maxLength={500}
                      defaultValue={value}
                      placeholder="https://"
                    />
                  ) : def.kind === "line" ? (
                    <input id={key} name={key} type="text" maxLength={300} defaultValue={value} />
                  ) : (
                    <textarea
                      className="board-input"
                      id={key}
                      name={key}
                      maxLength={4000}
                      rows={4}
                      defaultValue={value}
                    />
                  )}
                  {def.help && <p className="field-help">{def.help}</p>}
                </div>
              );
            })}
          </fieldset>
        ))}
        <div className="settings-save">
          <button className="btn" type="submit">
            Save All Settings
          </button>
        </div>
      </form>
    </>
  );
}
