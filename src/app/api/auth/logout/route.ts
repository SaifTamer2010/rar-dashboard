import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Token from "@/models/Token";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (refreshToken) {
    await connectToDatabase();
    const dbToken = await Token.findOneAndUpdate(
      { refresh_token: refreshToken },
      { revoked: true }
    );
    console.log({refreshToken})
    console.log({dbToken})
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("refresh_token");
  return response;
}