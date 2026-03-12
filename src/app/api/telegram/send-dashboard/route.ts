import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Campaign from "@/models/Campaign";
import { sendTelegramMessage } from "@/lib/telegram";
import { formatDashboardMessage } from "@/lib/formatDashboard";

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

    const byUser = await User.aggregate([
      { $match: { role: "user" } },
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
        $project: { _id: 0, name: 1, count: { $size: "$leads" } },
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
        $project: { _id: 0, name: 1, count: { $size: "$leads" } },
      },
      { $sort: { count: -1 } },
    ]);

    const totalLeads = await Lead.countDocuments(dateMatch);

    const lastLead = await Lead.findOne()
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

    await sendTelegramMessage(message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("send dashboard error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
