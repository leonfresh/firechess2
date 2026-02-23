import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="glass-card max-w-md space-y-5 p-8">
        <span className="text-6xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          404
        </span>
        <h1 className="text-2xl font-extrabold text-white">Page not found</h1>
        <p className="text-sm text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-shadow hover:shadow-glow-sm"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
