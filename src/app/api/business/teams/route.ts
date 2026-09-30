import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import AgentProfile from "@/models/agentProfile";
import Campaign from "@/models/Campaign";
import Lead from "@/models/Lead";
import { getOwnerBusniess } from "@/lib/busniess";

/** Every team in the business, with member and lead counts for the overview. */
export async function GET() {
  const busniess = await getOwnerBusniess();

  if (!busniess) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const teams = await Team.find({ busniess_id: busniess._id }).sort({ createdAt: -1 });
    const teamIds = teams.map((t) => t._id);

    const profiles = await AgentProfile.find({ team_id: { $in: teamIds } });
    const campaigns = await Campaign.find({ team_id: { $in: teamIds } }, "team_id");

    // One pass over leads: count per user, then roll members up into their team.
    const leadCounts = await Lead.aggregate([
      { $match: { userId: { $in: profiles.map((p) => p.user_id) } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const leadsByUser = new Map(leadCounts.map((l) => [String(l._id), l.count]));

    const stats = new Map(
      teams.map((t) => [String(t._id), { members: 0, leads: 0, campaigns: 0 }]),
    );

    for (const profile of profiles) {
      const stat = stats.get(String(profile.team_id));
      if (!stat) continue;
      stat.members += 1;
      stat.leads += leadsByUser.get(String(profile.user_id)) ?? 0;
    }

    for (const campaign of campaigns) {
      const stat = stats.get(String(campaign.team_id));
      if (stat) stat.campaigns += 1;
    }

    return NextResponse.json({
      teams: teams.map((t) => ({
        id: String(t._id),
        name: t.name,
        createdAt: t.createdAt,
        ...(stats.get(String(t._id)) ?? { members: 0, leads: 0, campaigns: 0 }),
      })),
    });
  } catch (error) {
    console.error("busniess teams error:", error);
    return NextResponse.json({ message: "Error fetching teams" }, { status: 500 });
  }
}

/** Create an empty team the owner can fill later. */
export async function POST(req: NextRequest) {
  const busniess = await getOwnerBusniess();

  if (!busniess) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ message: "Name required" }, { status: 400 });
    }

    await connectToDatabase();

    const team = await Team.create({ name: name.trim(), busniess_id: busniess._id });

    return NextResponse.json({ id: String(team._id), name: team.name });
  } catch (error) {
    console.error("create team error:", error);
    return NextResponse.json({ message: "Error creating team" }, { status: 500 });
  }
}
