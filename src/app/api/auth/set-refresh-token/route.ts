import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Token from "@/models/Token";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const { name } = await req.json();

  await connectToDatabase();

  const user = await User.findOne({ name });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Get the latest non-revoked token for this user
  const tokenDoc = await Token.findOne({ 
    user_id: user._id, 
    revoked: false 
  }).sort({ created_at: -1 });

  if (!tokenDoc) return NextResponse.json({ error: "No token found" }, { status: 404 });

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