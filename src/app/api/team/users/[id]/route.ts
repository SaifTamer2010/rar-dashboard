import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import AgentProfile from "@/models/agentProfile";
import { getLeaderTeam } from "@/lib/teamlead";

/** Pull an unassigned agent of the same business onto the leader's team. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const team = await getLeaderTeam();

  if (!team) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectToDatabase();

    // Role check is the whole point: leaders and owners are off limits.
    const user = await User.findOne({
      _id: id,
      busniess_id: team.busniess_id,
      role: "agent",
    });

    if (!user) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    const existing = await AgentProfile.findOne({ user_id: user._id });

    if (existing && String(existing.team_id) !== String(team._id)) {
      return NextResponse.json(
        { message: "That agent is already on another team" },
        { status: 409 },
      );
    }

    await AgentProfile.findOneAndUpdate(
      { user_id: user._id },
      { user_id: user._id, team_id: team._id, updatedAt: new Date() },
      { upsert: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("team assign error:", error);
    return NextResponse.json({ message: "Error assigning agent" }, { status: 500 });
  }
}

/** Drop an agent off the leader's own team. Other teams are untouchable. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const team = await getLeaderTeam();

  if (!team) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectToDatabase();

    const user = await User.findOne({
      _id: id,
      busniess_id: team.busniess_id,
      role: "agent",
    });

    if (!user) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    const removed = await AgentProfile.deleteOne({
      user_id: user._id,
      team_id: team._id,
    });

    if (removed.deletedCount === 0) {
      return NextResponse.json(
        { message: "That agent is not on your team" },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("team unassign error:", error);
    return NextResponse.json({ message: "Error removing agent" }, { status: 500 });
  }
}
