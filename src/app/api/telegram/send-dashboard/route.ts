import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Campaign from "@/models/Campaign";
import { sendTelegramToBusniess } from "@/lib/telegram";
import { formatDashboardMessage } from "@/lib/formatDashboard";
import { getTeamAgentIds, getViewerTeamId } from "@/lib/team";

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
            userId: { name: (lastLead.userId as any)?.name || "Unknown" },
            campaignId: {
              name: (lastLead.campaignId as any)?.name || "Unknown",
            },
            createdAt: new Date(lastLead.createdAt).toISOString(),
          }
        : null,
      session.user.name,
    );

    const sender = await User.findById(session.user.id, "busniess_id");
    await sendTelegramToBusniess(sender?.busniess_id, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("send dashboard error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
