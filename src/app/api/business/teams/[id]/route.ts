import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";
import AgentProfile from "@/models/agentProfile";
import Campaign from "@/models/Campaign";
import Lead from "@/models/Lead";
import { getOwnerBusiness } from "@/lib/business";

/** One team's dashboard: who is on it, what they logged, and against which campaigns. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const business = await getOwnerBusiness();

  if (!business) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectToDatabase();

    const team = await Team.findOne({ _id: id, busniess_id: business._id });
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    const profiles = await AgentProfile.find({ team_id: team._id });
    const userIds = profiles.map((p) => p.user_id);
    const users = await User.find({ _id: { $in: userIds } }, "name email");

    const teamCampaigns = await Campaign.find({ team_id: team._id }, "name");
    const otherCampaigns = await Campaign.find(
      { busniess_id: business._id, team_id: { $ne: team._id } },
      "name team_id",
    );

    const byUser = await Lead.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const leadsByUser = new Map(byUser.map((l) => [String(l._id), l.count]));

    // Campaign totals count every lead on the campaign, not only this team's.
    const byCampaign = await Lead.aggregate([
      { $match: { campaignId: { $in: teamCampaigns.map((c) => c._id) } } },
      { $group: { _id: "$campaignId", count: { $sum: 1 } } },
    ]);
    const leadsByCampaign = new Map(byCampaign.map((l) => [String(l._id), l.count]));

    const members = users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      leads: leadsByUser.get(String(u._id)) ?? 0,
    }));

    return NextResponse.json({
      team: {
        id: String(team._id),
        name: team.name,
        telegramChatId: team.telegram_chat_id ?? "",
      },
      totalLeads: members.reduce((sum, m) => sum + m.leads, 0),
      members: members.sort((a, b) => b.leads - a.leads),
      campaigns: teamCampaigns.map((c) => ({
        id: String(c._id),
        name: c.name,
        leads: leadsByCampaign.get(String(c._id)) ?? 0,
      })),
      availableCampaigns: otherCampaigns.map((c) => ({
        id: String(c._id),
        name: c.name,
        assigned: !!c.team_id,
      })),
    });
  } catch (error) {
    console.error("team detail error:", error);
    return NextResponse.json({ message: "Error fetching team" }, { status: 500 });
  }
}

/** Owner edits a team's settings — right now its name and its Telegram chat. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const business = await getOwnerBusiness();

  if (!business) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name, telegramChatId } = await req.json();

    await connectToDatabase();

    // Scoped by busniess_id so an owner cannot edit another business's team.
    const team = await Team.findOne({ _id: id, busniess_id: business._id });
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    if (typeof name === "string" && name.trim()) {
      team.name = name.trim();
    }

    if (telegramChatId !== undefined) {
      const value = String(telegramChatId).trim();

      // Group chats are negative, channels start -100, DMs are positive. All
      // are integers — anything else is a paste of the wrong thing.
      if (value && !/^-?\d+$/.test(value)) {
        return NextResponse.json(
          { message: "A chat id is a number, like -1001234567890." },
          { status: 400 },
        );
      }

      team.telegram_chat_id = value || null;
    }

    team.updatedAt = new Date();
    await team.save();

    return NextResponse.json({
      id: String(team._id),
      name: team.name,
      telegramChatId: team.telegram_chat_id ?? "",
    });
  } catch (error) {
    console.error("update team error:", error);
    return NextResponse.json({ message: "Error updating team" }, { status: 500 });
  }
}
