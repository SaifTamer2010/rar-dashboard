import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { broadcastLeadUpdate, clients } from "@/lib/sse";
import User from "@/models/User";

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
    } & DefaultSession["user"];
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId } = await req.json();

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign required" }, { status: 400 });
    }

    await connectToDatabase();

    const lead = await Lead.create({
      userId: session.user.id,
      campaignId,
    });

    const user = await User.findById(session.user.id);

    broadcastLeadUpdate({
      userName: user.name,
      soundUrl: user.soundUrl || null,
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("lead error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
