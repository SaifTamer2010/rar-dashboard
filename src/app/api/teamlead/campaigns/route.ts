import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import { getLeaderTeam } from "@/lib/teamlead";

/**
 * The leader's own campaigns — the ones assigned to their team, nothing else.
 *
 * The team comes from the session via `getLeaderTeam()`, never from the
 * request, so there is no team id a caller could swap to read someone else's
 * list. A leader with no team gets an empty list, not another team's.
 */
export async function GET() {
  const team = await getLeaderTeam();

  if (!team) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const campaigns = await Campaign.find({ team_id: team._id }).sort({ name: 1 });

    return NextResponse.json({
      team: { id: String(team._id), name: team.name },
      campaigns,
    });
  } catch (error) {
    console.error("teamlead campaigns error:", error);
    return NextResponse.json(
      { message: "Error fetching campaigns" },
      { status: 500 },
    );
  }
}

/** Create a campaign already assigned to the leader's team. */
export async function POST(req: NextRequest) {
  const team = await getLeaderTeam();

  if (!team) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { name } = await req.json();

    const trimmed = typeof name === "string" ? name.trim() : "";

    if (!trimmed) {
      return NextResponse.json(
        { message: "Campaign name is required" },
        { status: 400 },
      );
    }

    if (trimmed.length > 80) {
      return NextResponse.json(
        { message: "Campaign name is too long" },
        { status: 400 },
      );
    }

    // Duplicates are only a problem inside the team — two teams may well run a
    // campaign of the same name, and the leader cannot see the other one anyway.
    const existing = await Campaign.findOne({ name: trimmed, team_id: team._id });

    if (existing) {
      return NextResponse.json(
        { message: "Your team already has a campaign with this name" },
        { status: 409 },
      );
    }

    const campaign = await Campaign.create({
      name: trimmed,
      team_id: team._id,
      busniess_id: team.busniess_id,
    });

    return NextResponse.json(
      { message: "Campaign created successfully", campaign },
      { status: 201 },
    );
  } catch (error) {
    console.error("teamlead create campaign error:", error);
    return NextResponse.json(
      { message: "Error creating campaign" },
      { status: 500 },
    );
  }
}
