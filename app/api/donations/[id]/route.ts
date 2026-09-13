import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

// Admin only — delete a donation log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { env } = getRequestContext();
    const { id } = await params;

    // Get the log to find the student
    const log = await env.DB.prepare(
      "SELECT student_id FROM b24_bb_donation_logs WHERE id = ?"
    )
      .bind(id)
      .first<{ student_id: string }>();

    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    // Delete the log
    await env.DB.prepare("DELETE FROM b24_bb_donation_logs WHERE id = ?").bind(id).run();

    // Recompute last_donated_at for the student
    const latest = await env.DB.prepare(
      "SELECT MAX(donated_at) as latest FROM b24_bb_donation_logs WHERE student_id = ?"
    )
      .bind(log.student_id)
      .first<{ latest: number | null }>();

    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      "UPDATE b24_bb_students SET last_donated_at = ?, updated_at = ? WHERE id = ?"
    )
      .bind(latest?.latest ?? null, now, log.student_id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete log" }, { status: 500 });
  }
}
