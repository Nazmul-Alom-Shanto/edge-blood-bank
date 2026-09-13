import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import bcrypt from "bcryptjs";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both current and new passwords are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    // Verify current password
    const user = await env.DB.prepare(
      "SELECT password FROM b24_bb_users WHERE id = ?"
    )
      .bind(userId)
      .first();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password as string);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
    }

    // Hash and save new password
    const hashed = await bcrypt.hash(newPassword, 10);
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      "UPDATE b24_bb_users SET password = ?, updated_at = ? WHERE id = ?"
    )
      .bind(hashed, now, userId)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
