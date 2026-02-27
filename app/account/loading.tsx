export default function AccountLoading() {
  return (
    <div className="relative min-h-screen px-6 py-16 md:px-10">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="h-5 w-72 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>

        {/* Profile card skeleton */}
        <div className="glass-card space-y-5 p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-4 w-56 animate-pulse rounded bg-white/[0.04]" />
            </div>
          </div>
        </div>

        {/* Plan card skeleton */}
        <div className="glass-card space-y-4 p-6">
          <div className="h-6 w-24 animate-pulse rounded bg-white/[0.06]" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-white/[0.04]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
