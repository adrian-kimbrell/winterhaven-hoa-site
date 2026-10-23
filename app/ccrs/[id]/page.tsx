import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ccrQuestion } from "@/lib/schema";
import { dateFmt } from "@/lib/content";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Prose } from "@/components/prose";
import { DraftNotice } from "@/components/draft-notice";
import { CommentSection } from "@/components/comment-section";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "CC&R Corner" };

export default async function QuestionPage({
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
  const q = await db.query.ccrQuestion.findFirst({ where: eq(ccrQuestion.id, id) });
  if (!q || (q.status !== "published" && !isAdmin)) notFound();

  return (
    <>
      <SiteHeader signedIn isAdmin={isAdmin} active="/ccrs" />
      <main className="board-main article">
        <a className="text-link thread-back" href="/ccrs">
          CC&amp;R Corner
        </a>
        <DraftNotice status={q.status} isAdmin={isAdmin} editHref={`/admin/ccrs/${q.id}`} />
        <p className="eyebrow">
          CC&amp;R Corner
          {q.publishedAt ? ` · ${dateFmt.format(q.publishedAt)}` : ""}
        </p>
        <h1 className="section-title ccr-question">&ldquo;{q.question}&rdquo;</h1>
        {q.shortAnswer && <p className="article-standfirst">{q.shortAnswer}</p>}
        <Prose text={q.answer} className="prose article-body" />
        {q.sectionRef && <p className="article-note">See {q.sectionRef} of the CC&amp;Rs.</p>}
        {q.status === "published" && (
          <CommentSection type="ccr" targetId={q.id} viewer={session.user} error={error} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
