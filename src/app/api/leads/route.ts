import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher-server";
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

    const lead = await Lead.create({
      userId: user._id,
      campaignId,
    });

    await pusherServer.trigger("leads-channel", "lead-added", {
      userName: user.name,
      userId: user._id.toString(), // just send the ID
    });

    // after Lead.create(...)
    const campaignObject = await Campaign.findById(campaignId);
    const campaignName = campaignObject?.name || "Unknown Campaign";

    const mention = user.telegramUsername
      ? `@${user.telegramUsername}`
      : user.name;

    // Fetch personal or global message template
    const Settings = (await import("@/models/Settings")).default;
    const settings = await Settings.findOne();
    
    // Priority: User Personal Template > Global Settings Template > Hardcoded Default
    const leadMessageTemplate = user.get("leadMessageTemplate", null, { strict: false });
    console.log("Lead API Debug - User Message Template:", leadMessageTemplate);
    const template = leadMessageTemplate || settings?.leadMessageTemplate;

    let message = `*${mention}* OUT HEEERRRREEEE COOOKKKEEEDDDDD OOOOOONNNN *${campaignName}* 🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥`;
    
    if (template) {
      message = template
        .replace(/{name}/gi, mention)
        .replace(/{campaign}/gi, campaignName);
    }

    await sendTelegramMessage(message);

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("lead error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
