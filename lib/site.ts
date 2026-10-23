import { cache } from "react";
import { db } from "./db";
import { siteSetting } from "./schema";
import { sizedKey, snapWidth } from "./photo-sizes";

/* Every editable piece of site copy, with its default. The admin Site
   Settings page renders one field per entry, in this order. Image
   entries hold a blob key under site/; empty means "use the default
   photo shipped in /public". Document entries hold a blob key under
   documents/ (residents only), or empty for none. Link entries hold a
   web address, checked when saved. */
export const SETTINGS = {
  bannerText: {
    label: "Banner across the top of every page",
    help: "Leave empty to hide the banner.",
    kind: "line",
    group: "Site-wide",
    default: "Alpha preview · all content is placeholder",
  },
  footerLine: {
    label: "Footer address line",
    kind: "line",
    group: "Site-wide",
    default: "Winterhaven Village Homeowners Association · Tucson, Arizona",
  },
  footerNote: {
    label: "Footer note",
    help: "Small print beside the footer line. Leave empty to hide.",
    kind: "line",
    group: "Site-wide",
    default: "Alpha prototype — names, photos, and stories are placeholders.",
  },
  accessNote: {
    label: "How to get an account",
    help: "Shown on the sign-in page and on residents-only pages.",
    kind: "text",
    group: "Site-wide",
    default:
      "Accounts are created by the HOA. Need access or forgot your password? Contact a board member and we’ll get you set up.",
  },

  heroEyebrow: {
    label: "Hero eyebrow",
    kind: "line",
    group: "Public homepage",
    default: "Winterhaven Village · Tucson, Arizona",
  },
  heroHeadline: {
    label: "Hero headline",
    kind: "line",
    group: "Public homepage",
    default: "Desert living, neighborly spirit.",
  },
  heroImage: {
    label: "Hero photo",
    kind: "image",
    group: "Public homepage",
    default: "/img/gate-sunset.jpg",
  },
  heroImageAlt: {
    label: "Hero photo description",
    help: "For screen readers — describe what the photo shows.",
    kind: "line",
    group: "Public homepage",
    default:
      "The Winterhaven Village gate at sunset with the Santa Catalinas behind",
  },
  aboutHeading: {
    label: "About heading",
    kind: "line",
    group: "Public homepage",
    default: "A Neighborhood in the Desert Foothills",
  },
  mission: {
    label: "Mission statement",
    kind: "text",
    group: "Public homepage",
    default:
      "Winterhaven Village exists to make good neighbors: to keep our homes and common grounds beautiful, to share what we know and what we grow, and to look out for one another under the Catalinas.",
  },
  aboutBody: {
    label: "About the village",
    help: "Separate paragraphs with a blank line. Web and email addresses become links; to link words, write [the words](https://address).",
    kind: "text",
    group: "Public homepage",
    default:
      "The village sits in the Sonoran foothills northeast of Tucson — saguaro and ocotillo along the streets, quail in the washes, and mountain views from the moment you turn in at the gate. The homeowners association keeps the commons cared for and the community connected.",
  },
  aboutNote: {
    label: "Note under the mission statement",
    help: "Leave empty to hide.",
    kind: "line",
    group: "Public homepage",
    default: "Draft mission statement — pending committee approval.",
  },
  aboutImage: {
    label: "About photo",
    kind: "image",
    group: "Public homepage",
    default: "/img/gate-winter.jpg",
  },
  aboutImageAlt: {
    label: "About photo description",
    kind: "line",
    group: "Public homepage",
    default: "The Winterhaven Village gate on a rare winter snow day",
  },
  residentsQuote: {
    label: "Residents callout",
    kind: "line",
    group: "Public homepage",
    default: "If you live in the village, this site is yours.",
  },
  residentsNote: {
    label: "Residents callout note",
    kind: "line",
    group: "Public homepage",
    default: "Accounts are created by the HOA for Winterhaven Village residents.",
  },

  newsHeading: {
    label: "Community News heading",
    kind: "line",
    group: "Resident pages",
    default: "This Week at Winterhaven Village",
  },
  newsLede: {
    label: "Community News introduction",
    kind: "text",
    group: "Resident pages",
    default:
      "The weekly update on everything happening around the village — projects, plantings, and potlucks.",
  },
  boardLede: {
    label: "Board page introduction",
    kind: "text",
    group: "Resident pages",
    default:
      "What your board is working on, decided, and planning — posted here first, frequently and plainly.",
  },
  ccrLede: {
    label: "CC&R Corner introduction",
    kind: "text",
    group: "Resident pages",
    default:
      "One resident question about the CC&Rs answered every week — in plain English, with the section reference for the curious.",
  },
  lighterLede: {
    label: "Lighter Side introduction",
    kind: "text",
    group: "Resident pages",
    default:
      "The village humor column — gentle jokes, caption contests, and the occasional javelina.",
  },

  newsletterLabel: {
    label: "Newsletter button",
    kind: "line",
    group: "Resident links",
    default: "Latest Newsletter",
  },
  newsletterFile: {
    label: "Newsletter PDF",
    help: "Upload the newsletter here, or paste a link to it below. An upload takes priority over the link.",
    kind: "document",
    group: "Resident links",
    default: "",
  },
  newsletterUrl: {
    label: "Newsletter link",
    help: "Where the newsletter lives online, if it isn't uploaded above. Leave both empty to hide the button.",
    kind: "link",
    group: "Resident links",
    default: "",
  },
  portalLabel: {
    label: "Portal button",
    kind: "line",
    group: "Resident links",
    default: "GUD Portal",
  },
  portalUrl: {
    label: "Portal link",
    help: "The web address of the resident portal. Shown as a button on the residents' homepage. Leave empty to hide it.",
    kind: "link",
    group: "Resident links",
    default: "",
  },
} as const satisfies Record<
  string,
  {
    label: string;
    help?: string;
    kind: "line" | "text" | "image" | "document" | "link";
    group: string;
    default: string;
  }
>;

export type SettingKey = keyof typeof SETTINGS;
export type SiteSettings = Record<SettingKey, string>;

export const SETTING_KEYS = Object.keys(SETTINGS) as SettingKey[];

/* Cached per request: the layout, page, and footer all read it. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await db.select().from(siteSetting);
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(
    SETTING_KEYS.map((k) => [k, stored.get(k) ?? SETTINGS[k].default])
  ) as SiteSettings;
});

/* Image settings store either a blob key (uploaded) or a /public
   path (the default); this resolves either to a URL. */
export function settingImageUrl(value: string, width?: number) {
  if (value.startsWith("/")) return value;
  return `/api/photos/${width ? sizedKey(value, snapWidth(width)) : value}`;
}

/* The newsletter and portal buttons, or null where nothing is set. */
export function residentLinks(site: SiteSettings) {
  const newsletterHref = site.newsletterFile
    ? `/api/photos/${site.newsletterFile}`
    : site.newsletterUrl;
  return {
    newsletter: newsletterHref
      ? { href: newsletterHref, label: site.newsletterLabel || "Latest Newsletter" }
      : null,
    portal: site.portalUrl
      ? { href: site.portalUrl, label: site.portalLabel || "Resident Portal" }
      : null,
  };
}

/* Splits admin-entered text on blank lines. */
export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
