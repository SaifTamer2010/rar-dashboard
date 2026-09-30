import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher-server";
import { leadsChannel } from "@/lib/pusher-client";
import { sendTelegramToTeam } from "@/lib/telegram";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Campaign from "@/models/Campaign";
import { getViewerTeamId } from "@/lib/team";
import { getViewerBusinessId } from "@/lib/business";
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

    // The session id is the only authoritative handle on the caller. There used
    // to be a `findOne({ name })` fallback here; names are display-only and no
    // longer unique, so that could resolve a *different* account and log the
    // lead against them. A missing user is a re-login, not a guess.
    const user = await User.findById(session.user.id);

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

    // The team id comes from the session lookup above, never from the body, so
    // a caller cannot broadcast into another team's feed.
    await pusherServer.trigger(leadsChannel(String(teamId)), "lead-added", {
      userName: user.name,
      userId: user._id.toString(), // just send the ID
      campaignName,
    });

    const mention = user.telegramUsername
      ? `@${user.telegramUsername}`
      : user.name;

    // Fetch personal or business message template
    const Settings = (await import("@/models/Settings")).default;
    const busniessId = await getViewerBusinessId(String(user._id), user.role);

    // A bare findOne() here handed one business's template to all of them. Own
    // row first, then the legacy unscoped row — which is still the only one
    // anything writes, so behaviour is unchanged until a business gets its own.
    const settings =
      (busniessId && (await Settings.findOne({ busniess_id: busniessId }))) ||
      (await Settings.findOne({ busniess_id: null }));

    // Priority: User Personal Template > Business Settings Template > Hardcoded Default
    const leadMessageTemplate = user.get("leadMessageTemplate", null, { strict: false });
    const template = leadMessageTemplate || settings?.leadMessageTemplate;

    let message = `*${mention}* OUT HEEERRRREEEE COOOKKKEEEDDDDD OOOOOONNNN *${campaignName}* 🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥🥵🔥`;
    
    if (template) {
      message = template
        .replace(/{name}/gi, mention)
        .replace(/{campaign}/gi, campaignName);
    }

    // Goes to this agent's team chat — three teams, three separate feeds.
    // Falls back to the business-wide chat when the team has none set.
    await sendTelegramToTeam(teamId, message);

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("lead error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
