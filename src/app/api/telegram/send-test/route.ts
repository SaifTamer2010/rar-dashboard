import { NextRequest, NextResponse } from "next/server";
import { sendTelegramToBusiness, sendTelegramToTeam, telegramError } from "@/lib/telegram";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Business from "@/models/Business";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["super_admin", "busniess_owner"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, teamId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Owners test their own chat; anyone else tests the business they belong to.
    const owned = await Business.findOne({ user_id: session.user.id }, "_id");
    const sender = owned ? null : await User.findById(session.user.id, "busniess_id");

    // An owner can test a specific team's chat, or the business-wide fallback.
    const result = teamId
      ? await sendTelegramToTeam(teamId, message)
      : await sendTelegramToBusiness(owned?._id ?? sender?.busniess_id, message);

    if (!result.sent) {
      // `detail` is Telegram's own rejection body — it names the real problem
      // ("chat not found", "bot was kicked"), which is what the tester needs.
      return NextResponse.json(
        { error: telegramError(result.reason, "detail" in result ? result.detail : undefined) },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("send test message error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
