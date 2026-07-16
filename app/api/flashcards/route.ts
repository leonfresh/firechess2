import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { flashcardBoards, flashcards } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");

  if (boardId) {
    const cards = await db
      .select()
      .from(flashcards)
      .where(and(eq(flashcards.boardId, boardId), eq(flashcards.userId, session.user.id)))
      .orderBy(desc(flashcards.createdAt));
    return NextResponse.json(cards);
  }

  const boards = await db
    .select()
    .from(flashcardBoards)
    .where(eq(flashcardBoards.userId, session.user.id))
    .orderBy(desc(flashcardBoards.updatedAt));
  return NextResponse.json(boards);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Create a board
  if (body.name && !body.fen) {
    const board = await db
      .insert(flashcardBoards)
      .values({ userId: session.user.id, name: body.name, description: body.description ?? "" })
      .returning();
    return NextResponse.json(board[0]);
  }

  // Create a flashcard
  if (body.boardId && body.fen) {
    const card = await db
      .insert(flashcards)
      .values({
        boardId: body.boardId,
        userId: session.user.id,
        fen: body.fen,
        label: body.label ?? "",
        note: body.note ?? "",
        orientation: body.orientation ?? "w",
        userMove: body.userMove ?? "",
        bestMove: body.bestMove ?? "",
        eco: body.eco ?? "",
        openingName: body.openingName ?? "",
        reportId: body.reportId ?? null,
        tags: body.tags ?? [],
      })
      .returning();
    await db
      .update(flashcardBoards)
      .set({ cardCount: sql`cardCount + 1`, updatedAt: new Date() })
      .where(eq(flashcardBoards.id, body.boardId));
    return NextResponse.json(card[0]);
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");
  const boardId = searchParams.get("boardId");

  if (cardId) {
    const card = await db
      .delete(flashcards)
      .where(and(eq(flashcards.id, cardId), eq(flashcards.userId, session.user.id)))
      .returning();
    if (card.length > 0) {
      await db
        .update(flashcardBoards)
        .set({ cardCount: sql`GREATEST(cardCount - 1, 0)`, updatedAt: new Date() })
        .where(eq(flashcardBoards.id, card[0].boardId));
    }
    return NextResponse.json({ deleted: true });
  }

  if (boardId) {
    await db
      .delete(flashcards)
      .where(and(eq(flashcards.boardId, boardId), eq(flashcards.userId, session.user.id)));
    await db
      .delete(flashcardBoards)
      .where(and(eq(flashcardBoards.id, boardId), eq(flashcardBoards.userId, session.user.id)));
    return NextResponse.json({ deleted: true });
  }

  return NextResponse.json({ error: "Missing cardId or boardId" }, { status: 400 });
}
