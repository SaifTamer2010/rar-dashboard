import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Campaign from "@/models/Campaign";
import { sendTelegramToTeam, telegramError } from "@/lib/telegram";
import { formatDashboardMessage } from "@/lib/formatDashboard";
import { getTeamAgentIds, getViewerTeamId } from "@/lib/team";

/** Reads `name` off a populated ref, falling back when the populate missed. */
function populatedName(ref: unknown) {
  if (ref && typeof ref === "object" && "name" in ref) {
    const name = (ref as { name?: unknown }).name;
    if (typeof name === "string") return name;
  }
  return "Unknown";
}

export async function POST() {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    // Same date filter as stats route
    const now = new Date();
    const start = new Date();
    start.setUTCHours(5, 0, 0, 0);
    if (now.getUTCHours() < 5) {
      start.setUTCDate(start.getUTCDate() - 1);
    }
    const dateMatch = { createdAt: { $gte: start } };

    // Same wall as the dashboard: this team's agents, this team's campaigns.
    const teamId = await getViewerTeamId(session.user.id);

    if (!teamId) {
      return NextResponse.json({ error: "You are not on a team" }, { status: 403 });
    }

    const agentIds = await getTeamAgentIds(teamId);
    const teamCampaigns = await Campaign.find({ team_id: teamId }, "_id");
    const campaignIds = teamCampaigns.map((c) => c._id);

    const byUser = await User.aggregate([
      { $match: { _id: { $in: agentIds } } },
      {
        $lookup: {
          from: "leads",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userId", "$$userId"] },
                campaignId: { $in: campaignIds },
                ...dateMatch,
              },
            },
          ],
          as: "leads",
        },
      },
      {
        $project: { _id: 0, name: 1, count: { $size: "$leads" } },
      },
      { $sort: { count: -1 } },
    ]);

    const byCampaign = await Campaign.aggregate([
      { $match: { _id: { $in: campaignIds } } },
      {
        $lookup: {
          from: "leads",
          let: { campaignId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$campaignId", "$$campaignId"] },
                userId: { $in: agentIds },
                ...dateMatch,
              },
            },
          ],
          as: "leads",
        },
      },
      {
        $project: { _id: 0, name: 1, count: { $size: "$leads" } },
      },
      { $sort: { count: -1 } },
    ]);

    const totalLeads = await Lead.countDocuments({
      userId: { $in: agentIds },
      campaignId: { $in: campaignIds },
      ...dateMatch,
    });

    const lastLead = await Lead.findOne({
      userId: { $in: agentIds },
      campaignId: { $in: campaignIds },
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name")
      .populate("campaignId", "name");

    const message = formatDashboardMessage(
      byUser,
      byCampaign,
      totalLeads,
      lastLead
        ? {
            userId: { name: populatedName(lastLead.userId) },
            campaignId: { name: populatedName(lastLead.campaignId) },
            createdAt: new Date(lastLead.createdAt).toISOString(),
          }
        : null,
      session.user.name,
    );

    const result = await sendTelegramToTeam(teamId, message);

    if (!result.sent) {
      return NextResponse.json(
        { error: telegramError(result.reason) },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("send dashboard error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
