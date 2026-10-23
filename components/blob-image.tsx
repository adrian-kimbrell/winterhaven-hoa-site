"use client";

import Image, { type ImageLoader } from "next/image";
import { sizedKey, snapWidth } from "@/lib/photo-sizes";

/* Uploaded photos are stored in a few sizes (lib/photo-sizes.ts), so
   blob-backed images get a real srcset without going through the Next
   optimizer — which fetches without the viewer's cookies and so can't
   read private photos. A client component because loaders are
   functions. */
const photoLoader: ImageLoader = ({ src, width }) =>
  sizedKey(src, snapWidth(width));

/* Fills its positioned parent, like the static images it replaces. */
export function FillImage({
  src,
  alt,
  sizes,
  priority,
  quality,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  quality?: number;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      preload={priority}
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? "eager" : undefined}
      className={className}
      loader={src.startsWith("/api/photos/") ? photoLoader : undefined}
    />
  );
}
