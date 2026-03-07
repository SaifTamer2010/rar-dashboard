import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, currentPassword, newPassword } = await req.json();

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Update name
    if (name && name !== user.name) {
      user.name = name;
    }

    // Update password
    if (currentPassword && newPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid)
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      user.password = await bcrypt.hash(newPassword, 12);
    }

    await user.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("update user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
