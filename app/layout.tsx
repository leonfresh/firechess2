import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FireChess - Opening Leak Scanner",
  description: "Scan repeated opening mistakes from recent Lichess games"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
