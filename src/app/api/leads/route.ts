import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher-server";
import { sendTelegramToBusniess } from "@/lib/telegram";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Campaign from "@/models/Campaign";
import { getViewerTeamId } from "@/lib/team";
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

    // Find user first
    let user = await User.findById(session.user.id);
    
    // Backup: find by name if ID lookup fails
    if (!user && session.user.name) {
      user = await User.findOne({ name: session.user.name });
    }

    if (!user) {
      console.error("Lead API Error: User not found.", {
        sessionId: session.user.id,
        sessionName: session.user.name
      });
      return NextResponse.json({ error: "User not found. Please re-login." }, { status: 404 });
    }

    // A lead can only be logged on a campaign that belongs to the user's own team.
    const teamId = await getViewerTeamId(String(user._id));

    if (!teamId) {
      return NextResponse.json(
        { error: "You are not on a team yet." },
        { status: 403 },
      );
    }

    const ownCampaign = await Campaign.findOne({ _id: campaignId, team_id: teamId });

    if (!ownCampaign) {
      return NextResponse.json(
        { error: "That campaign is not on your team." },
        { status: 403 },
      );
    }

    const lead = await Lead.create({
      userId: user._id,
      campaignId,
    });

    // after Lead.create(...)
    const campaignObject = await Campaign.findById(campaignId);
    const campaignName = campaignObject?.name || "Unknown Campaign";

    await pusherServer.trigger("leads-channel", "lead-added", {
      userName: user.name,
      userId: user._id.toString(), // just send the ID
      campaignName,
    });

    const mention = user.telegramUsername
      ? `@${user.telegramUsername}`
      : user.name;

    // Fetch personal or global message template
    const Settings = (await import("@/models/Settings")).default;
    const settings = await Settings.findOne();
    
    // Priority: User Personal Template > Global Settings Template > Hardcoded Default
    const leadMessageTemplate = user.get("leadMessageTemplate", null, { strict: false });
    const template = leadMessageTemplate || settings?.leadMessageTemplate;

    let message = `*${mention}* OUT HEEERRRREEEE COOOKKKEEEDDDDD OOOOOONNNN *${campaignName}* 🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥`;
    
    if (template) {
      message = template
        .replace(/{name}/gi, mention)
        .replace(/{campaign}/gi, campaignName);
    }

    // Goes to the chat the user's own business configured, nowhere else.
    await sendTelegramToBusniess(user.busniess_id, message);

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("lead error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
