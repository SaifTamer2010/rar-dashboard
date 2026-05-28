import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Campaign from "@/models/Campaign";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const allTime = searchParams.get("allTime") === "true";

    let dateMatch: Record<string, any> = {};

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

    const byUser = await User.aggregate([
      { $match: { isActive: true } },
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

    const totalLeads = await Lead.countDocuments(dateMatch);

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
