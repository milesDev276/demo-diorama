import Link from "next/link";

const SCREEN = "flex h-screen w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#FDF6EC] to-[#EAD9C2] px-4 text-center";

/** Shown while the editor's code or the diorama itself is loading. */
export function EditorLoadingScreen() {
  return (
    <div className={SCREEN}>
      <p className="text-sm font-medium text-[#8B6F52]">Loading Diorama…</p>
    </div>
  );
}

/** Shown instead of the editor when the diorama cannot be opened. */
export function EditorMessageScreen({ title, message }: { title: string; message: string }) {
  return (
    <div className={SCREEN}>
      <h1 className="text-base font-semibold text-[#4A3421]">{title}</h1>
      <p className="max-w-sm text-sm text-[#4A3421]/60">{message}</p>
      <Link
        href="/dioramas"
        className="mt-2 rounded-full bg-[#F0B27A] px-4 py-2 text-sm font-medium text-[#4A3421] shadow-[0_4px_16px_rgba(240,178,122,0.4)] transition-colors hover:bg-[#eda868] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6F52]"
      >
        Back to My Dioramas
      </Link>
    </div>
  );
}
