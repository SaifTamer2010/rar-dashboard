import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { enforceRateLimit, LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, "check-user", LIMITS.checkUser);
    if (limited) return limited;

    const { email } = await req.json();

    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    await connectToDatabase();

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (!user) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      hasPassword: !!user.password,
      name: user.name,
    });
  } catch (error) {
    console.error("check-user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
