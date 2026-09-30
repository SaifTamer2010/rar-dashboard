import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getViewerTeamId } from "@/lib/team";
import { pusherServer } from "@/lib/pusher-server";
import { leadsChannel, LEADS_CHANNEL_PREFIX } from "@/lib/pusher-client";

/**
 * Signs a `private-` channel subscription, or refuses it.
 *
 * pusher-js posts here before every private subscription. The signature is made
 * with PUSHER_SECRET, which only the server holds, so this route is the actual
 * authorization boundary for realtime — Pusher itself performs no check beyond
 * verifying our signature.
 *
 * The channel name arrives from the browser and is therefore untrusted. It is
 * never signed as given: we resolve the caller's own channel from their session
 * and sign only on an exact match. Signing whatever was asked for would rebuild
 * the public channel with extra steps.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // pusher-js sends this form-encoded, not as JSON.
    const form = await req.formData();
    const socketId = String(form.get("socket_id") ?? "");
    const channel = String(form.get("channel_name") ?? "");

    if (!socketId || !channel) {
      return NextResponse.json({ error: "Missing socket or channel" }, { status: 400 });
    }

    // One prefix is supported. Anything else is refused rather than passed
    // through, so a new channel family cannot be authorized by accident.
    if (!channel.startsWith(LEADS_CHANNEL_PREFIX)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teamId = await getViewerTeamId(session.user.id);
    if (!teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // The whole security control, in one comparison.
    if (channel !== leadsChannel(String(teamId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const authorized = pusherServer.authorizeChannel(socketId, channel);

    return NextResponse.json(authorized);
  } catch (error) {
    console.error("pusher auth error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
