export default function BlogLoading() {
  return (
    <div className="relative min-h-screen px-6 py-16 md:px-10">
      <div className="mx-auto w-full max-w-4xl space-y-10">
        {/* Header skeleton */}
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-56 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="mx-auto h-5 w-80 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>

        {/* Posts skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card space-y-4 p-6">
              <div className="h-5 w-3/4 animate-pulse rounded bg-white/[0.06]" />
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.04]" />
              </div>
              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
