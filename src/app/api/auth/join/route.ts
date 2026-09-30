import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Invite from "@/models/Invite";
import Business from "@/models/Business";
import AgentProfile from "@/models/agentProfile";
import { enforceRateLimit, LIMITS } from "@/lib/rate-limit";

/** GET — what business is behind this invite token, so the join page can name it. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ message: "Missing token" }, { status: 400 });
  }

  await connectToDatabase();

  const invite = await Invite.findOne({ token });
  if (!invite) {
    return NextResponse.json({ message: "Invalid invite" }, { status: 404 });
  }

  const business = await Business.findById(invite.busniess_id);

  return NextResponse.json({ companyName: business?.company_name ?? null });
}

/** POST — sign up through an invite. Lands the user in the business, no team yet. */
export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, "join-invite", LIMITS.joinInvite);
    if (limited) return limited;

    const { token, name, email, password } = await req.json();

    if (!token || !name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const invite = await Invite.findOne({ token });
    if (!invite) {
      return NextResponse.json({ error: "This invite link is not valid" }, { status: 404 });
    }

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
      role: "agent",
      busniess_id: invite.busniess_id,
    });

    if (invite.team_id) {
      await AgentProfile.create({ user_id: user._id, team_id: invite.team_id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("join error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
