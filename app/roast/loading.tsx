export default function RoastLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030712]">
      <div className="text-center space-y-4">
        <div className="text-5xl animate-pulse">🔥</div>
        <div className="mx-auto h-8 w-48 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="mx-auto h-4 w-64 animate-pulse rounded-lg bg-white/[0.04]" />
      </div>
    </div>
  );
}
