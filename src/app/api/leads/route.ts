import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher";
import { sendTelegramMessage } from "@/lib/telegram";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Campaign from "@/models/Campaign";
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

    await pusherServer.trigger("leads-channel", "lead-added", {
      userName: user.name,
      userId: user._id.toString(), // just send the ID
    });

    // after Lead.create(...)
    const campaignObject = await Campaign.findById(campaignId);
    await sendTelegramMessage(
      `*${user.name}* WITH ONE LEAD DOWN ONNN *${campaignObject.name}* 🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥`,
    );

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("lead error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
