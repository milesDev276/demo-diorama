import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diorama Editor — Farmodoro",
  description: "Craft a small, cozy 3D diorama: place trees, a house, and rocks, then move, rotate and scale them.",
};

export default function DioramaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
