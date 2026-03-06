export default function OpeningsLoading() {
  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-52 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="mx-auto h-4 w-72 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>
        {/* Filter bar */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-lg bg-white/[0.04]" />
          ))}
        </div>
        {/* Opening cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
              <div className="h-5 w-40 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.04]" />
              <div className="flex gap-2">
                <div className="h-5 w-16 animate-pulse rounded-full bg-white/[0.04]" />
                <div className="h-5 w-20 animate-pulse rounded-full bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
