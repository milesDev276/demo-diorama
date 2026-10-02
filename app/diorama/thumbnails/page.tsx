"use client";

import dynamic from "next/dynamic";

/** Dev page: renders library thumbnails for scripts/capture-thumbnails.mjs. Not linked from the app. */
const ThumbnailStudio = dynamic(
  () => import("@/features/diorama/components/dev/ThumbnailStudio").then((mod) => mod.ThumbnailStudio),
  { ssr: false }
);

export default function ThumbnailsPage() {
  return <ThumbnailStudio />;
}
