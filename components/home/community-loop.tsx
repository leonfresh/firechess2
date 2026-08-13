"use client";

import Link from "next/link";
import { Flame, FolderOpen, Hammer } from "lucide-react";
import { HomepageCommunityFeed } from "@/components/homepage-community-feed";

type Props = {
  authenticated: boolean;
  userId?: string;
};

/**
 * Homepage "Community loop" section — surfaces the live feed + study-workflow
 * entry points. Shown when no scan is in flight.
 */
export function CommunityLoop({ authenticated, userId }: Props) {
  const cards = [
    {
      href: "/board",
      icon: Hammer,
      title: "Board Workbench",
      description:
        "Paste a FEN or PGN, trim the exact moment, and publish it without rebuilding the position by hand.",
      accent:
        "border-amber-400/20 bg-amber-400/[0.07] text-amber-200 hover:border-amber-300/40",
    },
    {
      href: "/community",
      icon: Flame,
      title: "Community Hub",
      description:
        "Browse live positions, opening debates, and study posts grounded in real boards rather than generic chat.",
      accent:
        "border-orange-400/20 bg-orange-400/[0.07] text-orange-200 hover:border-orange-300/40",
    },
    {
      href:
        authenticated && userId
          ? `/community/profile/${userId}`
          : "/community",
      icon: FolderOpen,
      title: authenticated ? "My Study Profile" : "Study Profiles",
      description: authenticated
        ? "Your saved boards and posts become a reviewable study surface instead of a forgotten report archive."
        : "Profiles collect positions, lessons, and lines into a shareable review deck.",
      accent:
        "border-red-400/20 bg-red-400/[0.07] text-red-200 hover:border-red-300/40",
    },
  ];

  const studyFlow = [
    {
      step: "01",
      title: "Scan the archive",
      description:
        "Run a report and isolate the repeat leaks that matter.",
    },
    {
      step: "02",
      title: "Lift the board out",
      description:
        "Push the exact moment into the workbench with context intact.",
    },
    {
      step: "03",
      title: "Discuss or drill",
      description:
        "Turn the lesson into a post, a saved card, or a training target.",
    },
  ];

  return (
    <section className="relative">
      <div
        className="relative overflow-hidden rounded-[2rem] px-5 py-6 shadow-[0_30px_100px_-56px_rgba(37,12,7,0.98)] sm:px-6 sm:py-7 lg:px-8"
        style={{
          background:
            "linear-gradient(150deg, rgba(11, 9, 12, 0.97) 0%, rgba(17, 12, 15, 0.96) 54%, rgba(46, 24, 14, 0.94) 100%)",
        }}
      >
        <div className="relative space-y-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-100/80">
                Community loop
              </p>

              <div className="mt-4">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Turn every report into a board people can actually use.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#f0edf2]/80 sm:text-base">
                  Once the scan finds the leak, you should be able to cut the
                  exact position, ask a sharper question, collect ideas, and
                  keep the lesson inside your study workflow.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <p className="max-w-sm text-sm leading-relaxed text-[#8d8696] lg:text-right">
                Fresh positions, opening debates, and study boards should stay
                playable right on the homepage.
              </p>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/[0.08] px-4 py-2 text-sm font-semibold text-orange-100 transition-colors hover:border-orange-300/35 hover:bg-orange-400/[0.14] hover:text-white"
              >
                View full feed
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <HomepageCommunityFeed />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
            <div className="divide-y divide-white/[0.08]">
              {cards.map((item, index) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group grid gap-3 py-4 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start"
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.accent}`}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-100/40">
                      0{index + 1}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-white transition-colors group-hover:text-orange-100">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#8d8696]">
                      {item.description}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/60 transition-colors group-hover:text-white sm:justify-self-end sm:pt-6">
                    Open
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>

            <div className="space-y-4 lg:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-100/70">
                Study Flow
              </p>

              <div className="space-y-4 border-l border-[#1e1a24] pl-4 sm:pl-5">
                {studyFlow.map((item) => (
                  <div key={item.step} className="relative">
                    <span className="absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full bg-amber-200/70 shadow-[0_0_0_6px_rgba(251,191,36,0.06)] sm:-left-[1.55rem]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#565061]">
                      Step {item.step}
                    </p>
                    <h3 className="mt-1.5 text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#8d8696]">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
