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

    const student = await env.DB.prepare(
      "SELECT * FROM b24_bb_students WHERE id = ? AND is_active = 1"
    )
      .bind(id)
      .first();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    const { name, blood_group, batch, phone, room_number } = (await request.json()) as {
      name?: string; blood_group?: string; batch?: string; phone?: string; room_number?: string;
    };

    const existing = await env.DB.prepare(
      "SELECT id FROM b24_bb_students WHERE id = ? AND is_active = 1"
    )
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      `UPDATE b24_bb_students
       SET name = COALESCE(?, name),
           blood_group = COALESCE(?, blood_group),
           batch = COALESCE(?, batch),
           phone = COALESCE(?, phone),
           room_number = COALESCE(?, room_number),
           updated_at = ?
       WHERE id = ?`
    )
      .bind(
        name ?? null,
        blood_group ?? null,
        batch ?? null,
        phone ?? null,
        room_number ?? null,
        now,
        id
      )
      .run();

    const updated = await env.DB.prepare("SELECT * FROM b24_bb_students WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({ student: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      "UPDATE b24_bb_students SET is_active = 0, updated_at = ? WHERE id = ?"
    )
      .bind(now, id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
