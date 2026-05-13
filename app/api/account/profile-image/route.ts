import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

const MAX_IMAGE_LENGTH = 2048;

function normalizeImageValue(value: unknown) {
  if (typeof value !== "string") {
    return { error: "image must be a string." };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { image: null as string | null };
  }

  if (trimmed.length > MAX_IMAGE_LENGTH) {
    return { error: "Image URL is too long." };
  }

  if (trimmed.startsWith("/")) {
    return { image: trimmed };
  }

  if (trimmed.startsWith("data:image/")) {
    return { image: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return {
        error:
          "Only http, https, root-relative, or data image URLs are allowed.",
      };
    }

    return { image: parsed.toString() };
  } catch {
    return { error: "Enter a valid image URL or leave it blank to clear it." };
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const normalized = normalizeImageValue(
    (body as { image?: unknown }).image ?? "",
  );
  if ("error" in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  await db
    .update(users)
    .set({ image: normalized.image })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ image: normalized.image });
}
