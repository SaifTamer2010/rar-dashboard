import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { getOwnerBusiness } from "@/lib/business";
import Business from "@/models/Business";

/** Everything the owner can edit about themselves and their business. */
export async function GET() {
  const business = await getOwnerBusiness();

  if (!business) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const session = await auth();
  const user = await User.findById(session?.user?.id, "name email");

  // The token itself never leaves the server — the client only needs to know
  // whether one is set so it can label the field.
  const withToken = await Business.findById(business._id).select("+telegram_bot_token");

  return NextResponse.json({
    name: user?.name ?? "",
    email: user?.email ?? "",
    companyName: business.company_name ?? "",
    telegramChatId: business.telegram_chat_id ?? "",
    // Both sending and chat-id discovery fall back to TELEGRAM_BOT_TOKEN, so an
    // env-only setup is a configured bot — reporting otherwise greys out the
    // "Find my chat ID" button on a page where it would have worked.
    telegramBotTokenSet: !!withToken?.telegram_bot_token || !!process.env.TELEGRAM_BOT_TOKEN,
  });
}

export async function POST(req: NextRequest) {
  const business = await getOwnerBusiness();

  if (!business) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const session = await auth();
    const {
      name,
      email,
      companyName,
      telegramChatId,
      telegramBotToken,
      currentPassword,
      newPassword,
    } = await req.json();

    await connectToDatabase();

    const user = await User.findById(session?.user?.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Name is a display label — only email identifies the account, so only
    // email has to stay unique.
    if (name?.trim() && name.trim() !== user.name) {
      user.name = name.trim();
    }

    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();

      if (normalizedEmail !== user.email) {
        const taken = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });
        if (taken) {
          return NextResponse.json({ error: "That email is already taken" }, { status: 409 });
        }
        user.email = normalizedEmail;
      }
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
      business.company_name = companyName.trim();
    }

    if (telegramChatId !== undefined) {
      const trimmedChatId = String(telegramChatId).trim();

      // Same guard the team PATCH uses. A chat id is an integer and group ids
      // are negative; without this a pasted group *name* saves fine and only
      // fails later, at send time, with a Telegram error nobody can read.
      if (trimmedChatId && !/^-?\d+$/.test(trimmedChatId)) {
        return NextResponse.json(
          { message: "A chat id is a number — group ids start with a minus. Use Find my chat ID." },
          { status: 400 },
        );
      }

      business.telegram_chat_id = trimmedChatId || null;
    }

    // An empty string means "leave it alone" — the field renders blank even
    // when a token is stored, so a blank save must not wipe it. Clearing is an
    // explicit action instead.
    if (typeof telegramBotToken === "string" && telegramBotToken.trim()) {
      const value = telegramBotToken.trim();

      // Telegram tokens look like 123456789:AA... — catch a pasted chat id
      // before it silently breaks every send.
      if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(value)) {
        return NextResponse.json(
          { error: "That does not look like a bot token. Expected 123456789:AA…" },
          { status: 400 },
        );
      }

      business.telegram_bot_token = value;
    }

    if (telegramBotToken === null) {
      business.telegram_bot_token = null;
    }

    business.updatedAt = new Date();

    await user.save();
    await business.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("business settings error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
