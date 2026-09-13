import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const { searchParams } = new URL(request.url);
    const bloodGroup = searchParams.get("blood_group");
    const batch = searchParams.get("batch");
    const search = searchParams.get("search");

    let query = "SELECT * FROM b24_bb_students WHERE is_active = 1";
    const bindings: string[] = [];

    if (bloodGroup) {
      query += " AND blood_group = ?";
      bindings.push(bloodGroup);
    }
    if (batch) {
      query += " AND batch = ?";
      bindings.push(batch);
    }
    if (search) {
      query += " AND (name LIKE ? OR phone LIKE ? OR room_number LIKE ?)";
      bindings.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY name ASC";

    const stmt = env.DB.prepare(query);
    const { results } = await stmt.bind(...bindings).all();

    return NextResponse.json({ students: results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const { name, blood_group, batch, phone, room_number, last_donated_at } = (await request.json()) as {
      name: string; blood_group: string; batch: string; phone?: string; room_number?: string; last_donated_at?: string;
    };

    if (!name || !blood_group || !batch) {
      return NextResponse.json({ error: "name, blood_group, and batch are required" }, { status: 400 });
    }

    const id = globalThis.crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const lastDonatedUnix = last_donated_at ? Math.floor(new Date(last_donated_at).getTime() / 1000) : null;

    await env.DB.prepare(
      `INSERT INTO b24_bb_students (id, name, blood_group, batch, phone, room_number, last_donated_at, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(id, name.trim(), blood_group, batch, phone || null, room_number || null, lastDonatedUnix, now, now)
      .run();

    const student = await env.DB.prepare("SELECT * FROM b24_bb_students WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
