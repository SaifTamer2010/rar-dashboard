import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Campaign from "@/models/Campaign";

export async function GET() {
  try {
    await connectToDatabase();

    // Start from users, left join leads
    const byUser = await User.aggregate([
      {
        $match: { role: "user" },
      },
      {
        $lookup: {
          from: "leads",
          localField: "_id",
          foreignField: "userId",
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

    // Start from campaigns, left join leads
    const byCampaign = await Campaign.aggregate([
      {
        $lookup: {
          from: "leads",
          localField: "_id",
          foreignField: "campaignId",
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

    const totalLeads = await Lead.countDocuments();

    return NextResponse.json({ byUser, byCampaign, totalLeads });
  } catch (error) {
    console.error("stats error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
