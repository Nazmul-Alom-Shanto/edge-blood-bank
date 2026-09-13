import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import bcrypt from "bcryptjs";

export const runtime = "edge";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    const requesterId = request.headers.get("x-user-id");
    const body = (await request.json()) as { role?: "admin" | "moderator"; password?: string };

    const now = Math.floor(Date.now() / 1000);

    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }
      const hashed = await bcrypt.hash(body.password, 10);
      await env.DB.prepare(
        "UPDATE b24_bb_users SET password = ?, updated_at = ? WHERE id = ?"
      )
        .bind(hashed, now, id)
        .run();
    }

    if (body.role) {
      if (!["admin", "moderator"].includes(body.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      // Cannot demote yourself
      if (id === requesterId && body.role !== "admin") {
        return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
      }

      await env.DB.prepare(
        "UPDATE b24_bb_users SET role = ?, updated_at = ? WHERE id = ?"
      )
        .bind(body.role, now, id)
        .run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = getRequestContext();
    const { id } = await params;
    const requesterId = request.headers.get("x-user-id");

    // Cannot delete yourself
    if (id === requesterId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await env.DB.prepare("DELETE FROM b24_bb_users WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
