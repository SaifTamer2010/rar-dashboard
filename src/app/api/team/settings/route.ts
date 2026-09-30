import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import { getLeaderTeam } from "@/lib/teamlead";

/**
 * Read-only view of the leader's own team wiring.
 *
 * Leaders can see where their team's shouts land so they can chase the owner
 * when it is wrong, but only the owner sets it — this route has no writer, and
 * the bot token is never part of the response.
 */
export async function GET() {
  const team = await getLeaderTeam();

  if (!team) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    // Read the fallback chat too, so the UI can say where messages actually go
    // when this team has no chat of its own.
    const business = await Business.findById(team.busniess_id)
      .select("telegram_chat_id company_name")
      .lean<{ telegram_chat_id?: string | null; company_name?: string }>();

    // Presence only — the token itself never leaves the server.
    const withToken = await Business.findById(team.busniess_id).select(
      "+telegram_bot_token",
    );

    return NextResponse.json({
      teamName: team.name ?? "",
      companyName: business?.company_name ?? "",
      telegramChatId: team.telegram_chat_id ?? "",
      fallbackChatId: business?.telegram_chat_id ?? "",
      botConfigured: !!withToken?.telegram_bot_token || !!process.env.TELEGRAM_BOT_TOKEN,
    });
  } catch (error) {
    console.error("team settings error:", error);
    return NextResponse.json({ message: "Error loading team settings" }, { status: 500 });
  }
}
