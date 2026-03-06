export default function TrainLoading() {
  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="h-10 w-56 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="h-4 w-80 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>
        {/* Mode cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-3">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-white/[0.06]" />
              <div className="h-5 w-32 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
