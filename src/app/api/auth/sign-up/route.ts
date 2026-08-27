import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Busniess from "@/models/Busniess";

export async function POST(req: NextRequest) {
  try {
    const { name, email, companyName, password } = await req.json();

    if (!name || !email || !companyName || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Sign in looks users up by name, so it has to stay unique.
    const existing = await User.findOne({ $or: [{ name }, { email }] });
    if (existing) {
      return NextResponse.json(
        { error: "That name or email is already taken" },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "busniess_owner",
    });

    await Busniess.create({
      user_id: user._id,
      company_name: companyName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("sign-up error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
