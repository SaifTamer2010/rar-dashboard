import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher-server";

export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Deliberately the one global broadcast left. Lead traffic and the shame
    // bell are per team now, but this is the super admin telling every open
    // dashboard to reload after a deploy or a data fix — reaching all of them is
    // the point, and the event carries no payload to leak.
    await pusherServer.trigger("leads-channel", "force-refresh", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("force-refresh error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
