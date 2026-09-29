import type { Background } from "@/types";

function unsplash(id: string, width: number) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

export const backgrounds: Background[] = [
  {
    id: "forest",
    title: "Forest",
    thumbnail: unsplash("photo-1441974231531-c6227db76b6e", 200),
    full: unsplash("photo-1441974231531-c6227db76b6e", 1920),
  },
  {
    id: "beach",
    title: "Beach",
    thumbnail: unsplash("photo-1507525428034-b723cf961d3e", 200),
    full: unsplash("photo-1507525428034-b723cf961d3e", 1920),
  },
  {
    id: "coffee-shop",
    title: "Coffee Shop",
    thumbnail: unsplash("photo-1445116572660-236099ec97a0", 200),
    full: unsplash("photo-1445116572660-236099ec97a0", 1920),
  },
  {
    id: "japanese-garden",
    title: "Japanese Garden",
    thumbnail: unsplash("photo-1493976040374-85c8e12f0c0e", 200),
    full: unsplash("photo-1493976040374-85c8e12f0c0e", 1920),
  },
  {
    id: "snow-cabin",
    title: "Snow Cabin",
    thumbnail: unsplash("photo-1517824806704-9040b037703b", 200),
    full: unsplash("photo-1517824806704-9040b037703b", 1920),
  },
  {
    id: "rainy-city",
    title: "Rainy City",
    thumbnail: unsplash("photo-1519692933481-e162a57d6721", 200),
    full: unsplash("photo-1519692933481-e162a57d6721", 1920),
  },
  {
    id: "library",
    title: "Library",
    thumbnail: unsplash("photo-1521587760476-6c12a4b040da", 200),
    full: unsplash("photo-1521587760476-6c12a4b040da", 1920),
  },
  {
    id: "mountain-sunset",
    title: "Mountain Sunset",
    thumbnail: unsplash("photo-1506905925346-21bda4d32df4", 200),
    full: unsplash("photo-1506905925346-21bda4d32df4", 1920),
  },
];
