import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import { chatDiscoveryError, discoverTelegramChats, getBotToken } from "@/lib/telegram";

/**
 * Lists the chats this business's bot has seen, so an owner can pick a chat id
 * instead of hunting for one. Telegram never shows a chat id in the app, so the
 * bot reads it off its own update queue.
 *
 * Read-only — nothing here writes a chat id anywhere. Saving is still the
 * settings and teams routes' job.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session || !["super_admin", "busniess_owner"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // The business comes from the session, never from the client — otherwise an
    // owner could read another business's chats by guessing an id.
    const business =
      session.user.role === "busniess_owner"
        ? await Business.findOne({ user_id: session.user.id }, "_id")
        : null;

    if (session.user.role === "busniess_owner" && !business) {
      return NextResponse.json(
        { error: "No business is linked to this account." },
        { status: 403 },
      );
    }

    // Same resolution as every send: the business's own bot, else the env one.
    // A super_admin has no business, so they poll the env bot.
    const token = await getBotToken(business?._id);
    const result = await discoverTelegramChats(token);

    if (!result.ok) {
      return NextResponse.json(
        { error: chatDiscoveryError(result.reason) },
        { status: result.reason === "no-token" ? 400 : 502 },
      );
    }

    // An empty queue is not an error — the bot simply has not been spoken to.
    // Telegram also drops updates older than 24 hours, so a long-quiet group
    // needs one fresh message.
    return NextResponse.json({
      chats: result.chats,
      hint: result.chats.length
        ? null
        : "This bot has not seen any chats yet. Add it to the group, send any message there, then look again. Telegram forgets messages older than 24 hours.",
    });
  } catch (error) {
    console.error("telegram chat-id error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
