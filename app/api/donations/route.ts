import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const loggedBy = request.headers.get("x-user-id");

    if (!loggedBy) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { student_id, donated_at, note } = (await request.json()) as {
      student_id: string; donated_at: string; note?: string;
    };

    if (!student_id || !donated_at) {
      return NextResponse.json(
        { error: "student_id and donated_at are required" },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await env.DB.prepare(
      "SELECT id FROM b24_bb_students WHERE id = ? AND is_active = 1"
    )
      .bind(student_id)
      .first();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const id = globalThis.crypto.randomUUID();
    const donatedAtUnix = Math.floor(new Date(donated_at).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);

    // Insert donation log
    await env.DB.prepare(
      `INSERT INTO b24_bb_donation_logs (id, student_id, donated_at, note, logged_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(id, student_id, donatedAtUnix, note || null, loggedBy, now)
      .run();

    // Update student's last_donated_at to the most recent donation
    await env.DB.prepare(
      `UPDATE b24_bb_students
       SET last_donated_at = (
         SELECT MAX(donated_at) FROM b24_bb_donation_logs WHERE student_id = ?
       ), updated_at = ?
       WHERE id = ?`
    )
      .bind(student_id, now, student_id)
      .run();

    const log = await env.DB.prepare("SELECT * FROM b24_bb_donation_logs WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to log donation" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const query = `
      SELECT 
        l.id, 
        l.donated_at, 
        l.note, 
        l.created_at,
        s.name as student_name,
        s.blood_group,
        s.batch,
        u.name as logged_by_name
      FROM b24_bb_donation_logs l
      JOIN b24_bb_students s ON l.student_id = s.id
      JOIN b24_bb_users u ON l.logged_by = u.id
      ORDER BY l.donated_at DESC, l.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const { results } = await env.DB.prepare(query)
      .bind(limit, offset)
      .all();

    return NextResponse.json({ logs: results });
  } catch (error) {
    console.error("Failed to fetch donation history:", error);
    return NextResponse.json({ error: "Failed to fetch donation history" }, { status: 500 });
  }
}
