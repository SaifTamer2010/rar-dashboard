import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";

export async function GET() {
  try {
    await connectToDatabase();

    const byUser = await Lead.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          name: "$user.name",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    const byCampaign = await Lead.aggregate([
      {
        $group: {
          _id: "$campaignId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "campaigns",
          localField: "_id",
          foreignField: "_id",
          as: "campaign",
        },
      },
      { $unwind: "$campaign" },
      {
        $project: {
          _id: 0,
          name: "$campaign.name",
          count: 1,
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
