import { NextRequest, NextResponse } from "next/server";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Campaign from "@/models/Campaign";
import { pusherServer } from "@/lib/pusher-server";
import { leadsChannel } from "@/lib/pusher-client";

const SILENCE_MINUTES = 30;

export async function GET(req: NextRequest) {
  // Vercel cron style auth: Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("shame bell: CRON_SECRET is not configured");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    // A single `findOne()` over every lead meant one busy team kept the bell
    // quiet for everyone else, and one global broadcast rang it at businesses
    // that were never silent. The window is now judged per team, which is the
    // unit the dashboard already counts in.
    const lastPerTeam = await Lead.aggregate<{
      _id: Types.ObjectId;
      lastLeadAt: Date;
    }>([
      {
        $lookup: {
          from: Campaign.collection.name,
          localField: "campaignId",
          foreignField: "_id",
          as: "campaign",
        },
      },
      { $unwind: "$campaign" },
      { $group: { _id: "$campaign.team_id", lastLeadAt: { $max: "$createdAt" } } },
      // Teams that have never logged a lead never reach this pipeline, so they
      // are skipped rather than counted as silent. Unassigned campaigns too.
      { $match: { _id: { $ne: null } } },
    ]);

    const now = Date.now();
    const rang: string[] = [];

    for (const team of lastPerTeam) {
      const diffMinutes = (now - new Date(team.lastLeadAt).getTime()) / 1000 / 60;
      if (diffMinutes < SILENCE_MINUTES) continue;

      await pusherServer.trigger(leadsChannel(String(team._id)), "shame-bell", {
        minutesSinceLastLead: Math.floor(diffMinutes),
      });
      rang.push(String(team._id));
    }

    return NextResponse.json({
      success: true,
      teamsChecked: lastPerTeam.length,
      teamsRung: rang,
    });
  } catch (error) {
    console.error("shame bell error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
