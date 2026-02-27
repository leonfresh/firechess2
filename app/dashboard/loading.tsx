export default function DashboardLoading() {
  return (
    <div className="relative min-h-screen px-6 py-16 md:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="h-5 w-96 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card space-y-3 p-5">
              <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-8 w-16 animate-pulse rounded-lg bg-white/[0.08]" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="glass-card h-64 animate-pulse bg-white/[0.03] p-6">
          <div className="h-4 w-32 rounded bg-white/[0.06]" />
        </div>

        {/* Reports list skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card flex items-center gap-4 p-5">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-white/[0.06]" />
                <div className="h-3 w-32 animate-pulse rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
