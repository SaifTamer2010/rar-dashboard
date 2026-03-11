import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { pusherServer } from "@/lib/pusher";

export async function GET() {
  try {
    await connectToDatabase();

    // Find the most recent lead
    const lastLead = await Lead.findOne().sort({ createdAt: -1 });

    if (!lastLead) return NextResponse.json({ skipped: "no leads ever" });

    const now = new Date();
    const diffMinutes =
      (now.getTime() - lastLead.createdAt.getTime()) / 1000 / 60;

    if (diffMinutes >= 30) {
      await pusherServer.trigger("leads-channel", "shame-bell", {
        minutesSinceLastLead: Math.floor(diffMinutes),
      });
    }

    return NextResponse.json({ success: true, diffMinutes });
  } catch (error) {
    console.error("shame bell error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
