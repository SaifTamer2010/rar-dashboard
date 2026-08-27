import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    await connectToDatabase();

    const user = await User.findOne({ email });

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
