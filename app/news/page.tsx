import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSettings, residentLinks } from "@/lib/site";
import { blobUrl } from "@/lib/uploads";
import { dateFmt } from "@/lib/content";
import { excerpt, publishedNews } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResidentGate } from "@/components/resident-gate";
import { FillImage } from "@/components/blob-image";
import { ResidentLinks } from "@/components/resident-links";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Community News" };

export default async function NewsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const site = await getSettings();
  if (!session) {
    return (
      <ResidentGate
        eyebrow="Community News"
        title={site.newsHeading}
        lede={site.newsLede}
        active="/news"
        features={[
          "A fresh community update every week",
          "Project progress, plantings, and event announcements",
          "Photos from around the village",
        ]}
      />
    );
  }
  const stories = await publishedNews();

  return (
    <>
      <SiteHeader signedIn isAdmin={session.user.role === "admin"} active="/news" />
      <main className="board-main">
        <p className="eyebrow">Community News</p>
        <h1 className="section-title">{site.newsHeading}</h1>
        <p className="board-lede">{site.newsLede}</p>
        <ResidentLinks
          links={[residentLinks(site).newsletter]}
          className="page-actions"
        />

        {stories.length === 0 ? (
          <p className="board-empty">No news yet — check back soon.</p>
        ) : (
          <div className="story-list">
            {stories.map((s) => (
              <a className="story" href={`/news/${s.id}`} key={s.id}>
                {s.imageKey ? (
                  <figure className="story-photo">
                    <FillImage
                      src={blobUrl(s.imageKey)}
                      alt={s.imageAlt ?? ""}
                      sizes="(max-width: 960px) 100vw, 460px"
                    />
                  </figure>
                ) : (
                  <div className="story-photo story-photo-empty" aria-hidden="true" />
                )}
                <div>
                  <p className="news-date">
                    {s.kicker ?? (s.publishedAt ? dateFmt.format(s.publishedAt) : "")}
                  </p>
                  <h2 className="story-title">{s.title}</h2>
                  <p className="story-body">{excerpt(s.summary, s.body)}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
