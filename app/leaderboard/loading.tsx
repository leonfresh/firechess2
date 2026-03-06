export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center space-y-3">
          <div className="mx-auto h-10 w-56 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="mx-auto h-4 w-80 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>
        {/* Toggle */}
        <div className="mb-8 flex justify-center">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-white/[0.04]" />
        </div>
        {/* Table rows */}
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4">
              <div className="h-6 w-6 animate-pulse rounded-full bg-white/[0.06]" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-white/[0.06]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
                <div className="h-3 w-20 animate-pulse rounded bg-white/[0.04]" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded-lg bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
