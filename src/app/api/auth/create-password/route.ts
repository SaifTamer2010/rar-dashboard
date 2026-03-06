import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { name, password } = await req.json();

    if (!name || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ name });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password) {
      return NextResponse.json(
        { error: "Password already set" },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    user.password = hashed;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("create-password error:", error); // this will show in terminal
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
