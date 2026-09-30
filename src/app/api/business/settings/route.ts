import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { getOwnerBusniess } from "@/lib/busniess";

/** Everything the owner can edit about themselves and their business. */
export async function GET() {
  const busniess = await getOwnerBusniess();

  if (!busniess) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const session = await auth();
  const user = await User.findById(session?.user?.id, "name email");

  return NextResponse.json({
    name: user?.name ?? "",
    email: user?.email ?? "",
    companyName: busniess.company_name ?? "",
    telegramChatId: busniess.telegram_chat_id ?? "",
  });
}

export async function POST(req: NextRequest) {
  const busniess = await getOwnerBusniess();

  if (!busniess) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const session = await auth();
    const { name, email, companyName, telegramChatId, currentPassword, newPassword } =
      await req.json();

    await connectToDatabase();

    const user = await User.findById(session?.user?.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Name and email both identify the account, so they have to stay unique.
    if (name && name !== user.name) {
      const taken = await User.findOne({ name, _id: { $ne: user._id } });
      if (taken) {
        return NextResponse.json({ error: "That name is already taken" }, { status: 409 });
      }
      user.name = name;
    }

    if (email && email !== user.email) {
      const taken = await User.findOne({ email, _id: { $ne: user._id } });
      if (taken) {
        return NextResponse.json({ error: "That email is already taken" }, { status: 409 });
      }
      user.email = email;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 },
        );
      }
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Enter your current password" },
          { status: 400 },
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.password ?? "");
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      user.password = await bcrypt.hash(newPassword, 12);
    }

    if (companyName?.trim()) {
      busniess.company_name = companyName.trim();
    }

    if (telegramChatId !== undefined) {
      busniess.telegram_chat_id = String(telegramChatId).trim() || null;
    }

    busniess.updatedAt = new Date();

    await user.save();
    await busniess.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("busniess settings error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
