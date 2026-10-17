import Link from "next/link";
import { Trees } from "lucide-react";
import { cn } from "@/lib/cn";

/** The header of the pages around the editor: the product name and the way to My Dioramas. */
export function SiteHeader({ current }: { current?: "dioramas" }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B6F52]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#A7C4A0]/40 text-[#4A3421]">
          <Trees size={17} />
        </span>
        <span className="text-sm font-semibold text-[#4A3421]">Japanese Diorama Builder</span>
      </Link>
      <nav aria-label="Main">
        <Link
          href="/dioramas"
          aria-current={current === "dioramas" ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium text-[#4A3421]/75 transition-colors hover:bg-white/70 hover:text-[#4A3421] focus-visible:outline-2 focus-visible:outline-[#8B6F52]",
            current === "dioramas" && "bg-white/70 text-[#4A3421]"
          )}
        >
          My Dioramas
        </Link>
      </nav>
    </header>
  );
}
