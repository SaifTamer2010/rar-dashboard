import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Campaign from "@/models/Campaign";
import { getTeamAgentIds, getViewerTeamId } from "@/lib/team";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const allTime = searchParams.get("allTime") === "true";

    let dateMatch: { createdAt?: { $gte?: Date; $lte?: Date } } = {};

    if (allTime) {
      dateMatch = {}; // No date filter for all time
    } else if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      const end = new Date(endDateParam);
      // Ensure the end date covers the full day (up to the last second)
      end.setUTCHours(23, 59, 59, 999);
      dateMatch = { createdAt: { $gte: start, $lte: end } };
    } else {
      // Default to "today" logic if no range provided
      const now = new Date();
      const start = new Date();
      start.setUTCHours(5, 0, 0, 0);

      // If before 5 AM UTC, go back to previous day's 5 AM
      if (now.getUTCHours() < 5) {
        start.setUTCDate(start.getUTCDate() - 1);
      }

      dateMatch = { createdAt: { $gte: start } };
    }

    // The dashboard is the viewer's team and nothing else.
    const teamId = await getViewerTeamId(session.user?.id);

    if (!teamId) {
      return NextResponse.json({
        byUser: [],
        byCampaign: [],
        totalLeads: 0,
        lastLead: null,
        teamId: null,
      });
    }

    const agentIds = await getTeamAgentIds(teamId);
    const campaigns = await Campaign.find({ team_id: teamId }, "_id name").sort({ name: 1 });
    const campaignIds = campaigns.map((c) => c._id);

    // Only this team's agents on this team's campaigns count anywhere below.
    const leadMatch = {
      userId: { $in: agentIds },
      campaignId: { $in: campaignIds },
      ...dateMatch,
    };

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
        $project: {
          _id: 0,
          name: 1,
          count: { $size: "$leads" },
        },
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
        $project: {
          _id: 0,
          name: 1,
          count: { $size: "$leads" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalLeads = await Lead.countDocuments(leadMatch);

    const lastLead = await Lead.findOne({
      userId: { $in: agentIds },
      campaignId: { $in: campaignIds },
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name")
      .populate("campaignId", "name");

    return NextResponse.json({
      byUser,
      byCampaign,
      totalLeads,
      lastLead,
      teamId: String(teamId),
    });
  } catch (error) {
    console.error("stats error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
