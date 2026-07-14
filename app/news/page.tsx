import Image from "next/image";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResidentGate } from "@/components/resident-gate";

/* Placeholder content until the admin news module lands — then this
   page reads from the database like the community board does. */
const STORIES = [
  {
    date: "Begins Monday",
    title: "Pool resurfacing begins Monday",
    body: "Swim laps under the Catalinas by July. The pool closes for two weeks while the plaster is renewed and the coping stones are reset. The spa stays open throughout.",
    img: "/img/pool.jpg",
    alt: "The community pool beneath the Santa Catalina mountains",
  },
  {
    date: "Now blooming",
    title: "New native pollinator garden at the east gate",
    body: "Penstemon, fairy duster, and desert marigold are in, courtesy of the volunteer garden crew. Hummingbirds have already found it.",
    img: "/img/garden.jpg",
    alt: "Desert courtyard garden in bloom",
  },
  {
    date: "Saturday, June 21",
    title: "Sunset potluck on the commons",
    body: "Bring a dish and a lawn chair. The board provides lemonade, iced tea, and the sunset.",
    img: "/img/sonoran.jpg",
    alt: "Sonoran desert landscape at golden hour",
  },
];

export default async function NewsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return (
      <ResidentGate
        eyebrow="Community News"
        title="This Week at Winterhaven Village"
        lede="The weekly update on everything happening around the village — projects, plantings, and potlucks."
        active="/news"
        features={[
          "A fresh community update every week",
          "Project progress, plantings, and event announcements",
          "Photos from around the village",
        ]}
      />
    );
  }

  return (
    <>
      <SiteHeader signedIn active="/news" />
      <main className="board-main">
        <p className="eyebrow">Community News</p>
        <h1 className="section-title">This Week at Winterhaven Village</h1>
        <p className="board-lede">
          The weekly update on everything happening around the village —
          projects, plantings, and potlucks.
        </p>

        <div className="story-list">
          {STORIES.map((s) => (
            <article className="story" key={s.title}>
              <figure className="story-photo">
                <Image
                  src={s.img}
                  alt={s.alt}
                  fill
                  sizes="(max-width: 960px) 100vw, 380px"
                />
              </figure>
              <div>
                <p className="news-date">{s.date}</p>
                <h3 className="story-title">{s.title}</h3>
                <p className="story-body">{s.body}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="optin-note">
          The news archive arrives with the admin news module — placeholder
          stories until then.
        </p>
      </main>
      <SiteFooter signedIn />
    </>
  );
}
