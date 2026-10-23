import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { newsStory } from "@/lib/schema";
import { blobUrl } from "@/lib/uploads";
import { dateFmt } from "@/lib/content";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Prose } from "@/components/prose";
import { DraftNotice } from "@/components/draft-notice";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Community News" };

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const isAdmin = session.user.role === "admin";
  const { id } = await params;
  const story = await db.query.newsStory.findFirst({ where: eq(newsStory.id, id) });
  if (!story || (story.status !== "published" && !isAdmin)) notFound();

  return (
    <>
      <SiteHeader signedIn isAdmin={isAdmin} active="/news" />
      <main className="board-main article">
        <a className="text-link thread-back" href="/news">
          All community news
        </a>
        <DraftNotice status={story.status} isAdmin={isAdmin} editHref={`/admin/news/${story.id}`} />
        <p className="news-date">
          {story.kicker ?? (story.publishedAt ? dateFmt.format(story.publishedAt) : "")}
        </p>
        <h1 className="section-title">{story.title}</h1>
        {story.publishedAt && story.kicker && (
          <p className="article-meta">{dateFmt.format(story.publishedAt)}</p>
        )}
        {story.imageKey && (
          <figure className="article-photo">
            <img src={blobUrl(story.imageKey, 1600)} alt={story.imageAlt ?? ""} />
          </figure>
        )}
        {story.summary && <p className="article-standfirst">{story.summary}</p>}
        <Prose text={story.body} className="prose article-body" />
      </main>
      <SiteFooter />
    </>
  );
}
