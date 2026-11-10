import { Trees } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A diorama's picture in a card (My Dioramas, the home page), 16:10: its
 * thumbnail, or a placeholder until the editor has taken one.
 */
export function DioramaThumbnail({ url, className }: { url: string | null; className?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- a local object URL, nothing for next/image to optimize
    <img src={url} alt="" className={cn("aspect-[16/10] w-full object-cover", className)} />
  ) : (
    <span className={cn("flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-b from-[#e9dcc8] to-[#d9c4a6] text-[#8B6F52]/70", className)}>
      <Trees size={28} />
    </span>
  );
}
