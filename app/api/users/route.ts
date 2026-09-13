import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import bcrypt from "bcryptjs";

export const runtime = "edge";

// Admin only
export async function GET() {
  try {
    const { env } = getRequestContext();
    const { results } = await env.DB.prepare(
      "SELECT id, name, email, role, created_at FROM b24_bb_users ORDER BY created_at DESC"
    ).all();

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const { name, email, password, role } = (await request.json()) as {
      name: string; email: string; password: string; role?: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
    }

    const validRole = role === "admin" ? "admin" : "moderator";

    // Check for existing email
    const existing = await env.DB.prepare(
      "SELECT id FROM b24_bb_users WHERE email = ?"
    )
      .bind(email.toLowerCase().trim())
      .first();

    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const id = globalThis.crypto.randomUUID();
    const hashed = await bcrypt.hash(password, 10);
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO b24_bb_users (id, name, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, name.trim(), email.toLowerCase().trim(), hashed, validRole, now, now)
      .run();

    return NextResponse.json(
      { user: { id, name, email, role: validRole } },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
