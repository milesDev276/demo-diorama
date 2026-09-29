"use client";

import dynamic from "next/dynamic";

const DioramaEditor = dynamic(
  () => import("@/features/diorama/components/DioramaEditor").then((mod) => mod.DioramaEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-[#FDF6EC] to-[#EAD9C2]">
        <p className="text-sm font-medium text-[#8B6F52]">Loading Diorama…</p>
      </div>
    ),
  }
);

export default function DioramaPage() {
  return <DioramaEditor />;
}
