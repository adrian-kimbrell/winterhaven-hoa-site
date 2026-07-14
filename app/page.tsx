import Image from "next/image";
import { headers } from "next/headers";
import { and, count, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comment, profile, thread, user } from "@/lib/schema";
import { NAV_LINKS } from "@/lib/nav";
import { SiteFooter } from "@/components/site-footer";

const boardDateFmt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
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
  const session = await auth.api.getSession({ headers: await headers() });

  const conversations = session
    ? await db
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
        .limit(3)
    : [];

  const neighbors = session
    ? await db.query.profile.findMany({
        where: eq(profile.optIn, true),
        with: { user: true, pets: true },
        limit: 3,
      })
    : [];

  return (
    <>
      <header className="hero">
        <Image
          src="/img/sunset1.jpg"
          alt="Saguaros at sunset in the Sonoran desert"
          fill
          priority
          sizes="100vw"
          className="hero-img"
        />
        <div className="hero-scrim" />
        <div className="alpha-tag">
          Alpha preview · all content is placeholder
        </div>
        <nav className="nav">
          <a className="wordmark" href="/">
            Winterhaven Village
          </a>
          <div className="nav-links">
            {session ? (
              <>
                {NAV_LINKS.map(([label, href]) => (
                  <a key={label} href={href}>
                    {label}
                  </a>
                ))}
              </>
            ) : (
              <>
                <a href="/">Home</a>
                <a href="#about">About</a>
                <a href="/login">Sign In</a>
              </>
            )}
          </div>
        </nav>
        <div className="hero-content">
          <p className="hero-eyebrow">Winterhaven Village · Tucson, Arizona</p>
          <h1>Desert living, neighborly spirit.</h1>
          <div className="hero-actions">
            {session ? (
              <>
                <a className="btn" href="/directory">
                  Resident Directory
                </a>
                <a className="btn btn-ghost" href="#news">
                  This Week&rsquo;s News
                </a>
              </>
            ) : (
              <>
                <a className="btn" href="/login">
                  Resident Sign In
                </a>
                <a className="btn btn-ghost" href="#about">
                  About the Village
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {!session && (
          <>
            <section id="about">
              <div className="container about-grid">
                <div>
                  <p className="eyebrow">About the Village</p>
                  <h2 className="section-title">
                    A Neighborhood in the Desert Foothills
                  </h2>
                  <p className="mission">
                    Winterhaven Village exists to make good neighbors: to keep
                    our homes and common grounds beautiful, to share what we
                    know and what we grow, and to look out for one another
                    under the Catalinas.
                  </p>
                  <p className="about-body">
                    Established in 1987, the village sits in the Sonoran
                    foothills northeast of Tucson — saguaro and ocotillo along
                    the streets, quail in the washes, and mountain views from
                    the moment you turn in at the gate. The homeowners
                    association keeps the commons cared for and the community
                    connected.
                  </p>
                  <p className="draft-note">
                    Draft mission statement — pending committee approval.
                  </p>
                </div>
                <figure className="about-photo">
                  <Image
                    src="/img/tucson.jpg"
                    alt="The mountain view on the drive into the village"
                    fill
                    sizes="(max-width: 960px) 100vw, 520px"
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
                <blockquote>
                  The directory, community board, news, and neighborly rest of
                  it live behind the gate.
                </blockquote>
                <p className="closes">
                  Accounts are created by the HOA for Winterhaven Village
                  residents.
                </p>
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
                  <h2 className="section-title">
                    This Week at Winterhaven Village
                  </h2>
                </div>
                <div className="news-grid">
                  <a className="news-lead" href="#">
                    <figure>
                      <Image
                        src="/img/pool.jpg"
                        alt="The community pool beneath the Santa Catalina mountains"
                        fill
                        sizes="(max-width: 960px) 100vw, 640px"
                      />
                    </figure>
                    <p className="news-date">Begins Monday</p>
                    <h3>Pool resurfacing begins Monday</h3>
                    <p>
                      Swim laps under the Catalinas by July. The pool closes
                      for two weeks while the plaster is renewed and the coping
                      stones are reset.
                    </p>
                  </a>
                  <div className="news-side">
                    <a className="news-item" href="#">
                      <div>
                        <p className="news-date">Now blooming</p>
                        <h4>New native pollinator garden at the east gate</h4>
                        <p>Penstemon, fairy duster, and desert marigold are in.</p>
                      </div>
                      <figure>
                        <Image
                          src="/img/garden.jpg"
                          alt="Desert courtyard garden in bloom"
                          fill
                          sizes="132px"
                        />
                      </figure>
                    </a>
                    <a className="news-item" href="#">
                      <div>
                        <p className="news-date">Saturday, June 21</p>
                        <h4>Sunset potluck on the commons</h4>
                        <p>Bring a dish and a lawn chair.</p>
                      </div>
                      <figure>
                        <Image
                          src="/img/sonoran.jpg"
                          alt="Sonoran desert landscape at golden hour"
                          fill
                          sizes="132px"
                        />
                      </figure>
                    </a>
                  </div>
                </div>
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

            <section className="lighter">
              <div className="container lighter-inner">
                <p className="eyebrow">The Lighter Side</p>
                <blockquote>
                  Caption contest: the Hendersons&rsquo; cat vs. the drip
                  irrigation system.
                </blockquote>
                <p className="closes">Voting closes Friday.</p>
                <a className="text-link" href="#">
                  Enter a caption
                </a>
              </div>
            </section>

            <section id="board">
              <div className="container board-ccr">
                <div>
                  <div className="section-head">
                    <p className="eyebrow">From the Board</p>
                    <h2 className="section-title">Updates &amp; Minutes</h2>
                  </div>
                  <ul className="board-list">
                    <li>
                      <p className="board-kind">Meeting Minutes</p>
                      <h4>May minutes posted</h4>
                      <p>
                        Full minutes from the May board meeting are available
                        to all residents.
                      </p>
                      <a className="text-link" href="/board">
                        Read the minutes
                      </a>
                    </li>
                    <li>
                      <p className="board-kind">Project Update</p>
                      <h4>Clubhouse facelift: bids under review</h4>
                      <p>
                        Proposals are being evaluated in two parts — structural
                        work and cosmetic refresh. A recommendation goes to the
                        board this month.
                      </p>
                      <a className="text-link" href="/board">
                        Follow the project
                      </a>
                    </li>
                  </ul>
                </div>
                <div id="ccr">
                  <div className="section-head">
                    <p className="eyebrow">CC&amp;R Corner</p>
                    <h2 className="section-title">Question of the Week</h2>
                  </div>
                  <div className="ccr-card">
                    <p className="q">
                      &ldquo;Can I park my RV in my driveway overnight?&rdquo;
                    </p>
                    <p className="a">
                      <strong>Yes, briefly.</strong> Up to 72 hours for loading
                      and unloading — see section 4.3 of the CC&amp;Rs for the
                      details and how to request an extension.
                    </p>
                    <div className="ccr-links">
                      <a className="text-link" href="/ccrs">
                        Past questions
                      </a>
                      <a className="text-link" href="/ccrs">
                        CC&amp;R Corner
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

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
                                src={`/api/photos/${n.photoKey}`}
                                alt={n.user.name}
                              />
                            ) : (
                              <div className="dir-initial" aria-hidden="true">
                                {n.user.name[0]}
                              </div>
                            )}
                          </figure>
                          <h4>{n.user.name}</h4>
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
    </>
  );
}
