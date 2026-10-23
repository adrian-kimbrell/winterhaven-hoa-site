/* Every uploaded photo is stored once at full size plus a WebP copy at
   each of these widths, made at upload. Pages ask for the smallest
   copy at least as wide as they need, so nothing is resized when a
   photo is viewed. Kept free of server imports: the image loader in
   components/blob-image.tsx uses it in the browser. */
export const PHOTO_WIDTHS = [400, 800, 1600] as const;
export type PhotoWidth = (typeof PHOTO_WIDTHS)[number];

/* "news/abc.jpg" at 800 is stored as "news/abc.jpg.w800.webp". */
export function sizedKey(key: string, width: PhotoWidth) {
  return `${key}.w${width}.webp`;
}

export function snapWidth(width: number): PhotoWidth {
  return PHOTO_WIDTHS.find((w) => w >= width) ?? PHOTO_WIDTHS[PHOTO_WIDTHS.length - 1];
}

/* The original key and width a sized key was made from, or null. */
export function parseSizedKey(key: string): { original: string; width: PhotoWidth } | null {
  const m = /^(.+)\.w(\d+)\.webp$/.exec(key);
  if (!m) return null;
  const width = Number(m[2]) as PhotoWidth;
  return PHOTO_WIDTHS.includes(width) ? { original: m[1], width } : null;
}
