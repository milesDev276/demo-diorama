import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editor",
  description: "Build a miniature Japanese street: place houses, shops, poles and plants, then photograph it.",
};

export default function DioramaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
