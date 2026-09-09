"use client";
import { usePathname } from "next/navigation";

export function EmbedGuard({ children, includePreviews = false }: { children: React.ReactNode; includePreviews?: boolean }) {
  const pathname = usePathname();
  if (
    pathname.startsWith("/embed/") ||
    (!includePreviews && (pathname === "/" || pathname === "/newlandingpage" ||
    pathname === "/newreportpage" ||
    pathname === "/newdashboard" ||
    pathname === "/newtraining" ||
    pathname === "/newpricing"))
  ) return null;
  return <>{children}</>;
}
