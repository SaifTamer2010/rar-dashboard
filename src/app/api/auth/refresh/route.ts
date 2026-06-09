import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Token from "@/models/Token";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  await connectToDatabase();

  // Find token in DB
  const tokenDoc = await Token.findOne({ refresh_token: refreshToken }).populate("user_id");

  if (!tokenDoc) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (tokenDoc.revoked) {
    return NextResponse.json({ error: "Token revoked" }, { status: 401 });
  }

  if (tokenDoc.expires_at < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 401 });
  }

  const user = tokenDoc.user_id as any;

  // Issue new refresh token (rotate it)
  const newRefreshToken = crypto.randomUUID();
  tokenDoc.refresh_token = newRefreshToken;
  tokenDoc.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await tokenDoc.save();

  // Set new refresh token cookie
  const response = NextResponse.json({ ok: true });
  response.cookies.set("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}