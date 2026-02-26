/**
 * Study Plan API
 *
 * GET    /api/study-plan          — Get the user's active study plan + tasks
 * POST   /api/study-plan          — Generate a new study plan from latest report
 * PATCH  /api/study-plan          — Toggle a task's completed status
 * DELETE /api/study-plan?id=...   — Delete a study plan
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studyPlans, studyTasks, reports } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { generateStudyPlan, type PlanInput } from "@/lib/study-plan-generator";

/* ------------------------------------------------------------------ */
/*  GET — fetch active study plan + tasks                               */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const source = searchParams.get("source");

  // Build where conditions — always scope to user + active
  const conditions = [eq(studyPlans.userId, session.user.id), eq(studyPlans.active, true)];
  if (username) conditions.push(eq(studyPlans.chessUsername, username));
  if (source) conditions.push(eq(studyPlans.source, source as "lichess" | "chesscom"));

  // Get the active plan (optionally scoped to a chess username)
  const plans = await db
    .select()
    .from(studyPlans)
    .where(and(...conditions))
    .orderBy(desc(studyPlans.createdAt))
    .limit(1);

  const plan = plans[0] ?? null;
  if (!plan) {
    return NextResponse.json({ plan: null, tasks: [] });
  }

  // Get tasks for this plan
  const tasks = await db
    .select()
    .from(studyTasks)
    .where(eq(studyTasks.planId, plan.id));

  // Sort: incomplete first, then by priority, then by dayIndex
  tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (a.dayIndex ?? 99) - (b.dayIndex ?? 99);
  });

  return NextResponse.json({ plan, tasks });
}

/* ------------------------------------------------------------------ */
/*  POST — generate a new study plan from the latest report             */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let reportId: string | undefined;
  let planInput: PlanInput;
  let chessUsername: string | null = null;
  let planSource: string | null = null;

  try {
    const body = await req.json();
    reportId = body.reportId;
    chessUsername = body.chessUsername ?? null;
    planSource = body.source ?? null;

    // If reportId provided, load from DB; otherwise use body data directly
    if (reportId) {
      const rows = await db
        .select()
        .from(reports)
        .where(and(eq(reports.id, reportId), eq(reports.userId, session.user.id)))
        .limit(1);

      const report = rows[0];
      if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }

      // Inherit username/source from the report if not provided
      if (!chessUsername) chessUsername = report.chessUsername;
      if (!planSource) planSource = report.source;

      planInput = {
        accuracy: report.estimatedAccuracy,
        leakCount: report.leakCount,
        repeatedPositions: report.repeatedPositions,
        tacticsCount: report.tacticsCount,
        gamesAnalyzed: report.gamesAnalyzed,
        weightedCpLoss: report.weightedCpLoss,
        severeLeakRate: report.severeLeakRate,
        estimatedRating: report.estimatedRating,
        scanMode: report.scanMode,
        topLeakOpenings: body.topLeakOpenings ?? [],
      };
    } else {
      planInput = body as PlanInput;
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Deactivate existing active plans for this username+source (not all plans)
  const deactivateConditions = [eq(studyPlans.userId, session.user.id), eq(studyPlans.active, true)];
  if (chessUsername) deactivateConditions.push(eq(studyPlans.chessUsername, chessUsername));
  if (planSource) deactivateConditions.push(eq(studyPlans.source, planSource as "lichess" | "chesscom"));

  const existingPlans = await db
    .select({ id: studyPlans.id })
    .from(studyPlans)
    .where(and(...deactivateConditions));

  for (const ep of existingPlans) {
    await db
      .update(studyPlans)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(studyPlans.id, ep.id));
  }

  // Generate study plan
  const generated = generateStudyPlan(planInput);

  // Create plan in DB
  const [plan] = await db
    .insert(studyPlans)
    .values({
      userId: session.user.id,
      reportId: reportId ?? null,
      chessUsername,
      source: planSource as "lichess" | "chesscom" | null,
      title: generated.title,
      weaknesses: generated.weaknesses,
      progress: 0,
      currentStreak: 0,
      longestStreak: 0,
      active: true,
    })
    .returning();

  // Create tasks in DB
  const taskValues = generated.tasks.map((t) => ({
    planId: plan.id,
    category: t.category,
    title: t.title,
    description: t.description,
    priority: t.priority,
    recurring: t.recurring,
    dayIndex: t.dayIndex ?? null,
    completed: false,
    link: t.link ?? null,
    icon: t.icon,
  }));

  const insertedTasks = taskValues.length > 0
    ? await db.insert(studyTasks).values(taskValues).returning()
    : [];

  return NextResponse.json({ plan, tasks: insertedTasks }, { status: 201 });
}

/* ------------------------------------------------------------------ */
/*  PATCH — toggle task completion + update plan progress/streaks       */
/* ------------------------------------------------------------------ */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { taskId, completed } = body;

  if (!taskId || typeof completed !== "boolean") {
    return NextResponse.json({ error: "taskId and completed are required" }, { status: 400 });
  }

  // Verify task belongs to user's plan
  const taskRows = await db
    .select({
      id: studyTasks.id,
      planId: studyTasks.planId,
    })
    .from(studyTasks)
    .innerJoin(studyPlans, eq(studyTasks.planId, studyPlans.id))
    .where(and(eq(studyTasks.id, taskId), eq(studyPlans.userId, session.user.id)))
    .limit(1);

  if (taskRows.length === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { planId } = taskRows[0];

  // Update task
  await db
    .update(studyTasks)
    .set({
      completed,
      completedAt: completed ? new Date() : null,
    })
    .where(eq(studyTasks.id, taskId));

  // Recalculate plan progress
  const allTasks = await db
    .select({ completed: studyTasks.completed })
    .from(studyTasks)
    .where(eq(studyTasks.planId, planId));

  const total = allTasks.length;
  const done = allTasks.filter((t) => t.completed).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  // Update streak
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const [currentPlan] = await db
    .select({
      currentStreak: studyPlans.currentStreak,
      longestStreak: studyPlans.longestStreak,
      lastActivityDate: studyPlans.lastActivityDate,
    })
    .from(studyPlans)
    .where(eq(studyPlans.id, planId))
    .limit(1);

  let { currentStreak, longestStreak, lastActivityDate } = currentPlan;

  if (completed && lastActivityDate !== today) {
    // Check if yesterday was the last activity (streak continues)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastActivityDate === yesterdayStr) {
      currentStreak += 1;
    } else if (lastActivityDate !== today) {
      currentStreak = 1; // Reset streak
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    lastActivityDate = today;
  }

  await db
    .update(studyPlans)
    .set({
      progress,
      currentStreak,
      longestStreak,
      lastActivityDate,
      updatedAt: new Date(),
    })
    .where(eq(studyPlans.id, planId));

  return NextResponse.json({
    progress,
    currentStreak,
    longestStreak,
    done,
    total,
  });
}

/* ------------------------------------------------------------------ */
/*  DELETE — delete a study plan                                        */
/* ------------------------------------------------------------------ */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Verify ownership
  const rows = await db
    .select({ id: studyPlans.id })
    .from(studyPlans)
    .where(and(eq(studyPlans.id, id), eq(studyPlans.userId, session.user.id)))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Tasks will cascade-delete
  await db.delete(studyPlans).where(eq(studyPlans.id, id));

  return NextResponse.json({ ok: true });
}
