"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/navbar";
import { Flame } from "lucide-react";
import type { ChessboardCompatProps } from "@/components/chessboard-compat";
import s from "./modern.module.css";

const Chessboard = dynamic(
  () => import("@/components/chessboard-compat").then((module) => module.Chessboard),
  { ssr: false, loading: () => <div className={s.boardLoading} aria-label="Loading chessboard" /> },
);

export function Brand() {
  return <Link href="/" className={s.brand}><span className={s.brandMark}><Flame size={22} fill="currentColor" /></span>FireChess<span className={s.brandDot}>.</span></Link>;
}

export function PreviewHeader(_props: { report?: boolean }) {
  const pathname = usePathname();
  if (pathname.startsWith("/report/") || pathname.startsWith("/scan/")) return null;
  return <Navbar />;
}

export function PreviewBoard(props: ChessboardCompatProps) {
  return <div className={s.board}><Chessboard
    arePiecesDraggable={false}
    animationDuration={180}
    customDarkSquareStyle={{ backgroundColor: "#59835f" }}
    customLightSquareStyle={{ backgroundColor: "#edf3df" }}
    customBoardStyle={{ borderRadius: "5px", overflow: "hidden" }}
    {...props}
  /></div>;
}
