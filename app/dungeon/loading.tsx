export default function DungeonLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030712]">
      <div className="text-center space-y-4">
        <div className="mx-auto h-16 w-16 animate-pulse rounded-2xl bg-white/[0.06]" />
        <div className="mx-auto h-6 w-40 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="mx-auto h-4 w-56 animate-pulse rounded bg-white/[0.04]" />
        <div className="mx-auto mt-6 h-10 w-36 animate-pulse rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}
