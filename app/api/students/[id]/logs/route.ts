import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;

    const { results } = await env.DB.prepare(
      `SELECT l.*, u.name as logged_by_name
       FROM b24_bb_donation_logs l
       LEFT JOIN b24_bb_users u ON l.logged_by = u.id
       WHERE l.student_id = ?
       ORDER BY l.donated_at DESC`
    )
      .bind(id)
      .all();

    return NextResponse.json({ logs: results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch donation logs" }, { status: 500 });
  }
}
