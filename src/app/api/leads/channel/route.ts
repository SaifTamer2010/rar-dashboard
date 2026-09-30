import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getViewerTeamId } from "@/lib/team";
import { leadsChannel } from "@/lib/pusher-client";

/**
 * The realtime lead channel this viewer may listen on. The browser has to be
 * told its name rather than build it, otherwise editing one string in devtools
 * puts you back on another team's feed.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = await getViewerTeamId(session.user?.id);

    // Nobody's team, nothing to hear — the dashboard just subscribes to nothing.
    return NextResponse.json({ channel: teamId ? leadsChannel(String(teamId)) : null });
  } catch (error) {
    console.error("leads channel error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
