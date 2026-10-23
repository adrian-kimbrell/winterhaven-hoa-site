import { headers } from "next/headers";
import { and, count, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comment, profile, thread, user } from "@/lib/schema";
import { NAV_LINKS } from "@/lib/nav";
import { SiteFooter } from "@/components/site-footer";
import { FillImage } from "@/components/blob-image";
import { Prose } from "@/components/prose";
import { residentLinks, getSettings, settingImageUrl } from "@/lib/site";
import { blobUrl } from "@/lib/uploads";
import {
  excerpt,
  publishedBoardPosts,
  publishedLighter,
  publishedNews,
  publishedQuestions,
} from "@/lib/queries";
import { NavSignOut } from "@/components/nav-sign-out";
import { HeroNav } from "@/components/hero-nav";
import { NavMenu } from "@/components/nav-menu";
import { ResidentLinks } from "@/components/resident-links";

const boardDateFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "America/Phoenix",
});

const todayFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "America/Phoenix",
});

/* Ocotillo sprig — the Botanical (No. 12) accent, used sparingly. */
function Ocotillo() {
  return (
    <svg
      width="44"
      height="40"
      viewBox="0 0 44 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M22 38 C 21 26, 20 14, 16 4" />
      <path d="M22 38 C 22.5 27, 24 16, 29 6" />
      <path d="M22 38 C 20 30, 14 20, 7 14" />
      <path d="M22 38 C 24 31, 31 22, 38 17" />
      <path d="M16.8 10 l -3 -1.4 M18 16 l -3.2 -1 M19.2 22 l -3.2 -0.6" />
      <path d="M27.6 11 l 3 -1.6 M25.8 17 l 3.2 -1.2 M24.4 23 l 3.2 -0.8" />
    </svg>
  );
}

export default async function Home() {
  // Session and settings in parallel; then every homepage query at
  // once — each is a separate database round trip.
  const [session, site] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getSettings(),
  ]);

  const [conversations, neighbors, news, lighter, boardPosts, questions] = session
    ? await Promise.all([
        db
          .select({
            id: thread.id,
            title: thread.title,
            createdAt: thread.createdAt,
            authorName: user.name,
            replies: count(comment.id),
          })
          .from(thread)
          .innerJoin(user, eq(thread.userId, user.id))
          .leftJoin(
            comment,
            and(
              eq(comment.targetType, "thread"),
              eq(comment.targetId, thread.id),
              eq(comment.status, "visible")
            )
          )
          .where(eq(thread.status, "visible"))
          .groupBy(thread.id, user.name)
          .orderBy(desc(thread.lastReplyAt))
          .limit(3),
        db.query.profile.findMany({
          where: eq(profile.optIn, true),
          with: { user: true, pets: true },
          limit: 3,
        }),
        publishedNews(3),
        publishedLighter(1),
        publishedBoardPosts(2),
        publishedQuestions(1),
      ])
    : [[], [], [], [], [], []];
  const [lead, ...sideStories] = news;
  const joke = lighter[0];
  const question = questions[0];

  return (
    <div className="home">
      <HeroNav>
        <a className="wordmark" href="/">
          Winterhaven Village
        </a>
        <NavMenu>
          {session ? (
            <>
              {NAV_LINKS.map(([label, href]) => (
                <a key={label} href={href}>
                  {label}
                </a>
              ))}
              <a href="/profile">My Profile</a>
              {session.user.role === "admin" && <a href="/admin">Admin</a>}
              <NavSignOut />
            </>
          ) : (
            <>
              <a href="/">Home</a>
              <a href="#about">About</a>
              <a href="/login">Sign In</a>
            </>
          )}
        </NavMenu>
      </HeroNav>
      <header className={session ? "hero hero-resident" : "hero"}>
        <FillImage
          src={settingImageUrl(site.heroImage)}
          alt={site.heroImageAlt}
          priority
          quality={60}
          sizes="100vw"
          className="hero-img"
        />
        <div className="hero-scrim" />
        <div className="hero-content">
          {session ? (
            <>
              <p className="hero-eyebrow">
                {todayFmt.format(new Date())} · Tucson, Arizona
              </p>
              <h1>Welcome home, {session.user.name.split(" ")[0]}.</h1>
              <ResidentLinks
                links={Object.values(residentLinks(site))}
                className="hero-actions"
              />
            </>
          ) : (
            <>
              <p className="hero-eyebrow">{site.heroEyebrow}</p>
              <h1>{site.heroHeadline}</h1>
              <div className="hero-actions">
                <a className="btn" href="/login">
                  Resident Sign In
                </a>
                <a className="btn btn-ghost" href="#about">
                  About the Village
                </a>
              </div>
            </>
          )}
        </div>
      </header>

      <main>
        {!session && (
          <>
            <section id="about">
              <div className="container about-grid">
                <div>
                  <p className="eyebrow">About the Village</p>
                  <h2 className="section-title">{site.aboutHeading}</h2>
                  <p className="mission">{site.mission}</p>
                  <Prose text={site.aboutBody} className="about-body" />
                  {site.aboutNote && (
                    <p className="draft-note">{site.aboutNote}</p>
                  )}
                </div>
                <figure className="about-photo">
                  <FillImage
                    src={settingImageUrl(site.aboutImage)}
                    alt={site.aboutImageAlt}
                    sizes="(max-width: 960px) calc(100vw - 56px), 460px"
                  />
                </figure>
              </div>
            </section>

            <div className="ornament">
              <Ocotillo />
            </div>

            <section className="lighter">
              <div className="container lighter-inner">
                <p className="eyebrow">Residents</p>
                <blockquote>{site.residentsQuote}</blockquote>
                <p className="closes">{site.residentsNote}</p>
                <a className="btn" href="/login">
                  Resident Sign In
                </a>
              </div>
            </section>
          </>
        )}

        {session && (
          <>
            <section id="news">
              <div className="container">
                <div className="section-head">
                  <p className="eyebrow">Community News</p>
                  <h2 className="section-title">{site.newsHeading}</h2>
                </div>
                {!lead ? (
                  <p className="board-empty">
                    No news this week — check back soon.
                  </p>
                ) : (
                  <div className={sideStories.length ? "news-grid" : undefined}>
                    <a className="news-lead" href={`/news/${lead.id}`}>
                      {lead.imageKey && (
                        <figure>
                          <FillImage
                            src={blobUrl(lead.imageKey)}
                            alt={lead.imageAlt ?? ""}
                            sizes="(max-width: 960px) calc(100vw - 56px), 600px"
                          />
                        </figure>
                      )}
                      {lead.kicker && <p className="news-date">{lead.kicker}</p>}
                      <h3>{lead.title}</h3>
                      <p>{excerpt(lead.summary, lead.body)}</p>
                    </a>
                    {sideStories.length > 0 && (
                      <div className="news-side">
                        {sideStories.map((s) => (
                          <a className="news-item" href={`/news/${s.id}`} key={s.id}>
                            <div>
                              {s.kicker && <p className="news-date">{s.kicker}</p>}
                              <h3>{s.title}</h3>
                              <p>{excerpt(s.summary, s.body, 90)}</p>
                            </div>
                            {s.imageKey && (
                              <figure>
                                <FillImage
                                  src={blobUrl(s.imageKey)}
                                  alt={s.imageAlt ?? ""}
                                  sizes="132px"
                                />
                              </figure>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="community-cta">
                  <a className="text-link" href="/news">
                    All community news
                  </a>
                </div>
              </div>
            </section>

            <div className="ornament">
              <Ocotillo />
            </div>

            {joke && (
              <section className="lighter">
                <div className="container lighter-inner">
                  <p className="eyebrow">The Lighter Side</p>
                  <blockquote>{joke.title}</blockquote>
                  {joke.note && <p className="closes">{joke.note}</p>}
                  <a className="text-link" href={`/lighter/${joke.id}`}>
                    {joke.allowComments ? "Join in" : "Read the column"}
                  </a>
                </div>
              </section>
            )}

            {(boardPosts.length > 0 || question) && (
              <section id="board">
                <div className="container board-ccr">
                  <div>
                    <div className="section-head">
                      <p className="eyebrow">From the Board</p>
                      <h2 className="section-title">Updates &amp; Minutes</h2>
                    </div>
                    {boardPosts.length === 0 ? (
                      <p className="board-empty">No board updates yet.</p>
                    ) : (
                      <ul className="board-list">
                        {boardPosts.map((p) => (
                          <li key={p.id}>
                            <p className="board-kind">
                              {p.kind === "minutes" ? "Meeting Minutes" : "Project Update"}
                            </p>
                            <h3>{p.title}</h3>
                            {p.body && <p>{excerpt(null, p.body, 180)}</p>}
                            <a className="text-link" href={`/board#post-${p.id}`}>
                              {p.kind === "minutes" ? "Read the minutes" : "Follow the project"}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div id="ccr">
                    <div className="section-head">
                      <p className="eyebrow">CC&amp;R Corner</p>
                      <h2 className="section-title">Question of the Week</h2>
                    </div>
                    {question ? (
                      <div className="ccr-card">
                        <p className="q">&ldquo;{question.question}&rdquo;</p>
                        <p className="a">
                          {question.shortAnswer && (
                            <strong>{question.shortAnswer} </strong>
                          )}
                          {excerpt(null, question.answer, 260)}
                        </p>
                        <div className="ccr-links">
                          <a className="text-link" href={`/ccrs/${question.id}`}>
                            Read &amp; discuss
                          </a>
                          <a className="text-link" href="/ccrs">
                            Past questions
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="board-empty">No question this week.</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section id="community">
              <div className="container">
                <div className="section-head">
                  <p className="eyebrow">Community Board</p>
                  <h2 className="section-title">Neighbors Are Talking</h2>
                </div>
                {conversations.length === 0 ? (
                  <p className="board-empty">
                    No conversations yet — be the first to start one.
                  </p>
                ) : (
                  <div className="thread-list">
                    {conversations.map((t) => (
                      <a
                        className="thread-row"
                        href={`/community/${t.id}`}
                        key={t.id}
                      >
                        <div>
                          <h3 className="thread-title">{t.title}</h3>
                          <p className="thread-meta">
                            Started by {t.authorName} ·{" "}
                            {boardDateFmt.format(t.createdAt)}
                          </p>
                        </div>
                        <div className="thread-replies">
                          <span className="thread-count">{t.replies}</span>
                          <span className="thread-count-label">
                            {t.replies === 1 ? "reply" : "replies"}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
                <div className="community-cta">
                  <a className="text-link" href="/community">
                    Visit the Community Board
                  </a>
                </div>
              </div>
            </section>

            <section className="neighbors" id="neighbors">
              <div className="container">
                <div className="section-head">
                  <p className="eyebrow">Resident Directory</p>
                  <h2 className="section-title">Meet Your Neighbors</h2>
                  <p className="lede">
                    Contact information, a photo or two, and the stories that
                    make the village feel like home.
                  </p>
                </div>
                {neighbors.length === 0 ? (
                  <>
                    <p className="board-empty">
                      The directory is brand new — add your profile and be the
                      first listing.
                    </p>
                    <div className="community-cta neighbors-cta">
                      <a className="btn" href="/profile">
                        Create My Listing
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="neighbor-grid">
                      {neighbors.map((n) => (
                        <a
                          className="neighbor-card"
                          href={`/directory/${n.userId}`}
                          key={n.userId}
                        >
                          <figure className="dir-figure">
                            {n.photoKey ? (
                              <img
                                src={blobUrl(n.photoKey, 320)}
                                alt={n.user.name}
                              />
                            ) : (
                              <div className="dir-initial" aria-hidden="true">
                                {n.user.name[0]}
                              </div>
                            )}
                          </figure>
                          <h3>{n.user.name}</h3>
                          {n.unit && <p className="street">{n.unit}</p>}
                          {n.pets.length > 0 && (
                            <p className="pets">
                              with {n.pets.map((p) => p.name).join(" & ")}
                            </p>
                          )}
                        </a>
                      ))}
                    </div>
                    <div className="community-cta neighbors-cta">
                      <a className="text-link" href="/directory">
                        Browse the full directory
                      </a>
                    </div>
                  </>
                )}
                <p className="optin-note">
                  Directory listings are opt-in. Residents choose what to
                  share.
                </p>
              </div>
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
