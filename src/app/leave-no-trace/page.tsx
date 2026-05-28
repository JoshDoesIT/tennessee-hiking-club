import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { StewardPledge } from "@/components/stewardship/steward-pledge";
import { CleanupLog } from "@/components/stewardship/cleanup-log";

export const metadata: Metadata = {
  title: "Leave No Trace",
  description:
    "The seven Leave No Trace principles and the Tennessee Hiking Club steward pledge.",
};

const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "Plan ahead and prepare",
    body: "Know the regulations, weather, and terrain; pack for what the trail and season demand.",
  },
  {
    title: "Travel and camp on durable surfaces",
    body: "Stay on the trail and on rock, gravel, or dry grass to keep fragile ground intact.",
  },
  {
    title: "Dispose of waste properly",
    body: "Pack it in, pack it out. Carry out all trash, leftover food, and litter.",
  },
  {
    title: "Leave what you find",
    body: "Leave rocks, plants, and historic features as you found them for the next hiker.",
  },
  {
    title: "Minimize campfire impacts",
    body: "Use a stove where you can; if you build a fire, keep it small and in existing rings.",
  },
  {
    title: "Respect wildlife",
    body: "Observe from a distance, never feed animals, and give them room, especially when nesting or raising young.",
  },
  {
    title: "Be considerate of other visitors",
    body: "Yield on the trail, keep noise down, and help everyone enjoy the quiet of the outdoors.",
  },
];

export default function LeaveNoTracePage() {
  return (
    <Container className="max-w-2xl py-12 sm:py-16">
      <p className="eyebrow text-amber-700">Stewardship</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Leave No Trace
      </h1>
      <p className="text-ink/75 mt-4 text-lg leading-relaxed">
        We hike Tennessee&rsquo;s trails because we love them. Leaving them
        better than we found them keeps them wild for everyone who comes next.
      </p>

      <ol className="mt-8 space-y-4">
        {PRINCIPLES.map((p, i) => (
          <li
            key={p.title}
            className="border-forest/10 bg-cream-50 rounded-xl border p-4 leading-relaxed"
          >
            <span className="text-forest font-semibold">
              {i + 1}. {p.title}.
            </span>{" "}
            <span className="text-ink/75">{p.body}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10">
        <StewardPledge />
      </div>

      <div className="mt-6">
        <CleanupLog />
      </div>

      <p className="text-ink/70 mt-6 text-sm">
        The seven principles are from the{" "}
        <a
          href="https://lnt.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pine hover:text-forest underline underline-offset-4"
        >
          Leave No Trace Center for Outdoor Ethics
        </a>
        .
      </p>
    </Container>
  );
}
