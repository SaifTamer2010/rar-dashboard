import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name)
      return NextResponse.json({ error: "Name required" }, { status: 400 });

    await connectToDatabase();

    const user = await User.findOne({ name });

    if (!user) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      hasPassword: !!user.password,
    });
  } catch (error) {
    console.error("check-user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
