import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lighterPost } from "@/lib/schema";
import { blobUrl } from "@/lib/uploads";
import { dateFmt } from "@/lib/content";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Prose } from "@/components/prose";
import { DraftNotice } from "@/components/draft-notice";
import { CommentSection } from "@/components/comment-section";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "The Lighter Side" };

export default async function LighterPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const isAdmin = session.user.role === "admin";
  const { id } = await params;
  const { error } = await searchParams;
  const post = await db.query.lighterPost.findFirst({ where: eq(lighterPost.id, id) });
  if (!post || (post.status !== "published" && !isAdmin)) notFound();

  return (
    <>
      <SiteHeader signedIn isAdmin={isAdmin} active="/lighter" />
      <main className="board-main article">
        <a className="text-link thread-back" href="/lighter">
          The Lighter Side
        </a>
        <DraftNotice status={post.status} isAdmin={isAdmin} editHref={`/admin/lighter/${post.id}`} />
        <p className="eyebrow">
          The Lighter Side
          {post.publishedAt ? ` · ${dateFmt.format(post.publishedAt)}` : ""}
        </p>
        <blockquote className="lighter-quote">{post.title}</blockquote>
        {post.imageKey && (
          <figure className="article-photo">
            <img src={blobUrl(post.imageKey, 1600)} alt={post.imageAlt ?? ""} />
          </figure>
        )}
        <Prose text={post.body} className="prose article-body" />
        {post.note && <p className="article-note">{post.note}</p>}
        {post.allowComments && post.status === "published" && (
          <CommentSection
            type="lighter"
            targetId={post.id}
            viewer={session.user}
            error={error}
          />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
