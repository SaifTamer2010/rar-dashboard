import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Campaign from "@/models/Campaign";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    // searchParams.get("filter") || "today" if you want to toggle between alltime and today's leads

    const filter = "today";

    // Build date filter — day runs from 5 AM UTC (7 AM Egypt) to next 5 AM UTC
    let dateMatch: Record<string, any> = {};
    if (filter === "today") {
      const now = new Date();
      const start = new Date();
      start.setUTCHours(5, 0, 0, 0);

      // If before 5 AM UTC, go back to previous day's 5 AM
      if (now.getUTCHours() < 5) {
        start.setUTCDate(start.getUTCDate() - 1);
      }

      dateMatch = { createdAt: { $gte: start } };
    }

    const byUser = await User.aggregate([
      { $match: { role: { $in: ["user", "admin"] } } },
      {
        $lookup: {
          from: "leads",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userId", "$$userId"] },
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
      {
        $lookup: {
          from: "leads",
          let: { campaignId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$campaignId", "$$campaignId"] },
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

    const totalLeads = await Lead.countDocuments(
      filter === "today" ? dateMatch : {},
    );

    const lastLead = await Lead.findOne()
      .sort({ createdAt: -1 })
      .populate("userId", "name")
      .populate("campaignId", "name");

    return NextResponse.json({ byUser, byCampaign, totalLeads, lastLead });
  } catch (error) {
    console.error("stats error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
