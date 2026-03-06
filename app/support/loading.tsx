export default function SupportLoading() {
  return (
    <div className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="h-8 w-40 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>
        {/* Ticket list */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-48 animate-pulse rounded bg-white/[0.06]" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-white/[0.04]" />
              </div>
              <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
