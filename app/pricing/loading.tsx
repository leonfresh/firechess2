export default function PricingLoading() {
  return (
    <div className="relative min-h-screen px-6 py-16 md:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-16">
        {/* Hero skeleton */}
        <div className="space-y-5 text-center">
          <div className="mx-auto h-8 w-40 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="mx-auto h-12 w-80 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="mx-auto h-5 w-96 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>

        {/* Plan cards skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card space-y-5 p-6 md:p-8">
              <div className="h-7 w-24 animate-pulse rounded-lg bg-white/[0.06]" />
              <div className="h-4 w-40 animate-pulse rounded bg-white/[0.04]" />
              <div className="h-10 w-20 animate-pulse rounded-lg bg-white/[0.08]" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-4 w-full animate-pulse rounded bg-white/[0.04]" />
                ))}
              </div>
              <div className="h-12 w-full animate-pulse rounded-xl bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
