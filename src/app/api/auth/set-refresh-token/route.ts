import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Token from "@/models/Token";
import { auth } from "@/lib/auth";

/**
 * Re-attaches the caller's own refresh token as an httpOnly cookie.
 *
 * This used to read an `email` out of the request body with no auth check at
 * all, which meant anyone could POST a stranger's address and be handed that
 * account's refresh token. The identity now comes from the session only — the
 * body is ignored entirely.
 */
export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const tokenDoc = await Token.findOne({
    user_id: session.user.id,
    revoked: false,
  }).sort({ created_at: -1 });

  if (!tokenDoc) {
    return NextResponse.json({ error: "No token found" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("refresh_token", tokenDoc.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
