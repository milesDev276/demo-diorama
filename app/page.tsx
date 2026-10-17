import Image from "next/image";
import { Camera, Move3d, Store } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StarterCards } from "@/features/dioramas/components/StarterCards";
import { StartBuildingButton } from "@/features/home/components/StartBuildingButton";

const STEPS = [
  {
    icon: Store,
    title: "Place the pieces",
    body: "Houses, small shops, utility poles, vending machines, bicycles and plants, all made for the same miniature world.",
  },
  {
    icon: Move3d,
    title: "Arrange the street",
    body: "Move, turn and line things up on a model base. Paint roads and sidewalks, string the power lines.",
  },
  {
    icon: Camera,
    title: "Take its photo",
    body: "Choose the time of day and the weather, frame the shot, and save it like a photo of a real model.",
  },
];

/** The home page: what the product is, and the ways into the editor (plan/Stage-17-Implementation.md D6). */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF6EC] to-[#EAD9C2]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <section className="grid items-center gap-10 py-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:py-14">
          <div className="flex flex-col gap-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8B6F52]">A miniature street in your browser</p>
            <h1 className="text-4xl font-semibold leading-tight text-balance text-[#4A3421] sm:text-5xl">
              Build a tiny Japanese street, one detail at a time.
            </h1>
            <p className="max-w-md text-base text-[#4A3421]/70">
              Arrange the ordinary corners of a Japanese neighborhood on a model base: the shop with its awning, the
              vending machine, the wires overhead. Then photograph it like a real miniature.
            </p>
            <StartBuildingButton />
          </div>
          <div className="overflow-hidden rounded-4xl shadow-[0_24px_64px_rgba(74,52,33,0.28)]">
            <Image
              src="/home/hero.webp"
              alt="A miniature Japanese street corner at golden hour: a small liquor shop, a vending machine, a utility pole and a ginkgo tree on a model base."
              width={1600}
              height={900}
              priority
              unoptimized
              className="aspect-video w-full object-cover"
            />
          </div>
        </section>

        <section aria-labelledby="starters-title" className="py-8">
          <h2 id="starters-title" className="text-lg font-semibold text-[#4A3421]">
            Start from a street
          </h2>
          <p className="mb-5 mt-1 text-sm text-[#4A3421]/60">Each one opens as your own copy, ready to rearrange.</p>
          <StarterCards />
        </section>

        <section aria-labelledby="steps-title" className="py-8">
          <h2 id="steps-title" className="sr-only">
            How it works
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="rounded-3xl border border-[#8b6f52]/15 bg-white/50 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A7C4A0]/40 text-[#4A3421]">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-[#4A3421]">
                  {index + 1}. {title}
                </h3>
                <p className="mt-1 text-sm text-[#4A3421]/65">{body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 text-xs text-[#4A3421]/45 sm:px-6">
        Your dioramas are kept in this browser. Made for desktop browsers.
      </footer>
    </div>
  );
}
