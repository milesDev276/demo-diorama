"use client";

import dynamic from "next/dynamic";
import { EditorLoadingScreen } from "./EditorScreens";

const DioramaEditor = dynamic(() => import("./DioramaEditor").then((mod) => mod.DioramaEditor), {
  ssr: false,
  loading: () => <EditorLoadingScreen />,
});

/** The editor page's client side. Keyed by id, so opening another diorama starts from a fresh editor. */
export function EditorRoute({ dioramaId }: { dioramaId: string }) {
  return <DioramaEditor key={dioramaId} dioramaId={dioramaId} />;
}
