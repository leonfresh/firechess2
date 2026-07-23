import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 });

  const allowedHosts = ["lichess.org", "api.chess.com", "chess.com"];
  try {
    const parsed = new URL(url);
    if (!allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith("." + h))) {
      return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "Accept": url.includes("lichess") ? "application/x-ndjson" : "application/json" },
    });
    if (!res.ok) return NextResponse.json({ error: "Upstream failed" }, { status: res.status });

    const text = await res.text();
    return new NextResponse(text, {
      headers: {
        "Content-Type": url.includes("lichess") ? "application/x-ndjson" : "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
