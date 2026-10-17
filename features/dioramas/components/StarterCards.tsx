import Image from "next/image";
import Link from "next/link";
import { SCENE_TEMPLATES } from "@/features/diorama/assets/sceneTemplates";

/** The built-in starters as links that create a diorama from one (`/diorama/new?starter=`). */
export function StarterCards() {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {SCENE_TEMPLATES.map((template) => (
        <li key={template.id}>
          <Link
            href={`/diorama/new?starter=${template.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#8b6f52]/15 bg-white/60 shadow-[0_8px_24px_rgba(139,111,82,0.08)] transition-shadow hover:shadow-[0_12px_32px_rgba(139,111,82,0.16)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6F52]"
          >
            <Image
              src={template.thumbnail}
              alt=""
              width={640}
              height={360}
              unoptimized
              className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <span className="flex flex-col gap-1 px-4 pb-4 pt-3">
              <span className="text-sm font-semibold text-[#4A3421]">{template.name}</span>
              <span className="text-xs text-[#4A3421]/60">{template.description}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
