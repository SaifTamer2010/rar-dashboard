import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import Lead from "@/models/Lead";
import Campaign from "@/models/Campaign";
import User from "@/models/User";
import { getTeamAgentIds, getViewerTeamId } from "@/lib/team";

/** The shift runs 3 PM through 5 AM, so 14 one-hour buckets. */
const START_HOUR = 15;
const BUCKETS = 14;

function label(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
}

/** Hourly lead totals for the viewer's team across one shift. */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const teamId = await getViewerTeamId(session.user?.id);

    if (!teamId) {
      return NextResponse.json({
        buckets: [],
        totalLeads: 0,
        start: null,
        end: null,
        topAchievers: [],
        previousTopAchievers: [],
        previousShiftStart: null,
      });
    }

    const agentIds = await getTeamAgentIds(teamId);
    const campaigns = await Campaign.find({ team_id: teamId }, "_id");
    const campaignIds = campaigns.map((c) => c._id);

    // A shift is dated by the day it started on, so 2 AM still belongs to yesterday.
    const dateParam = req.nextUrl.searchParams.get("date");
    const start = dateParam ? new Date(`${dateParam}T00:00:00.000Z`) : new Date();

    if (!dateParam && start.getUTCHours() < START_HOUR) {
      start.setUTCDate(start.getUTCDate() - 1);
    }

    start.setUTCHours(START_HOUR, 0, 0, 0);

    const end = new Date(start);
    end.setUTCHours(end.getUTCHours() + BUCKETS);

    const rows = await Lead.aggregate([
      {
        $match: {
          userId: { $in: agentIds },
          campaignId: { $in: campaignIds },
          createdAt: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
    ]);

    const counts = new Map<number, number>(rows.map((r) => [r._id as number, r.count]));

    const buckets = Array.from({ length: BUCKETS }, (_, i) => {
      const hour = (START_HOUR + i) % 24;
      return {
        hour,
        label: label(hour),
        count: counts.get(hour) ?? 0,
      };
    });

    // Who is carrying this shift, and who carried the one before it.
    const previousStart = new Date(start);
    previousStart.setUTCDate(previousStart.getUTCDate() - 1);
    const previousEnd = new Date(previousStart);
    previousEnd.setUTCHours(previousEnd.getUTCHours() + BUCKETS);

    async function topThree(from: Date, to: Date) {
      const rows = await Lead.aggregate([
        {
          $match: {
            userId: { $in: agentIds },
            campaignId: { $in: campaignIds },
            createdAt: { $gte: from, $lt: to },
          },
        },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 },
      ]);

      const users = await User.find({ _id: { $in: rows.map((r) => r._id) } }, "name");
      const nameOf = new Map(users.map((u) => [String(u._id), u.name]));

      return rows.map((row) => ({
        name: nameOf.get(String(row._id)) ?? "Unknown",
        count: row.count,
      }));
    }

    const [thisShiftTop, lastShiftTop] = await Promise.all([
      topThree(start, end),
      topThree(previousStart, previousEnd),
    ]);

    return NextResponse.json({
      buckets,
      totalLeads: buckets.reduce((sum, b) => sum + b.count, 0),
      topAchievers: thisShiftTop,
      previousTopAchievers: lastShiftTop,
      previousShiftStart: previousStart.toISOString(),
      start: start.toISOString(),
      end: end.toISOString(),
    });
  } catch (error) {
    console.error("intervals error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
