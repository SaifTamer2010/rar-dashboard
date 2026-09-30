import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Business from "@/models/Business";
import { enforceRateLimit, LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, "sign-up", LIMITS.signUp);
    if (limited) return limited;

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

    // Email is the only identity key — names are free to repeat.
    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "That email is already taken" },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
      role: "busniess_owner",
    });

    await Business.create({
      user_id: user._id,
      company_name: companyName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("sign-up error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
