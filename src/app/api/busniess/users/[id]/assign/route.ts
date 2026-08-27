import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Team from "@/models/Team";
import AgentProfile from "@/models/agentProfile";
import TeamLeaderProfile from "@/models/TeamLeaderProfile";
import { getOwnerBusniess } from "@/lib/busniess";

const ROLES = ["agent", "team_leader"];

/** Put a user on a team — an existing one, or a new one created on the spot. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const busniess = await getOwnerBusniess();

  if (!busniess) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { teamId, newTeamName, role } = await req.json();

    if (role && !ROLES.includes(role)) {
      return NextResponse.json({ message: "Unknown role" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ _id: id, busniess_id: busniess._id });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let team;

    if (newTeamName) {
      team = await Team.create({ name: newTeamName, busniess_id: busniess._id });
    } else if (teamId) {
      team = await Team.findOne({ _id: teamId, busniess_id: busniess._id });
    }

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    const nextRole = role || user.role || "agent";

    if (nextRole === "team_leader") {
      // A leader holds a leader profile only, and the team points back at it.
      await AgentProfile.deleteOne({ user_id: user._id });

      const leader = await TeamLeaderProfile.findOneAndUpdate(
        { user_id: user._id },
        { user_id: user._id, team_id: team._id, updatedAt: new Date() },
        { upsert: true, new: true },
      );

      team.team_leader_id = leader._id;
      team.updatedAt = new Date();
      await team.save();
    } else {
      await clearLeadership(user._id);

      await AgentProfile.findOneAndUpdate(
        { user_id: user._id },
        { user_id: user._id, team_id: team._id, updatedAt: new Date() },
        { upsert: true },
      );
    }

    user.role = nextRole;
    await user.save();

    return NextResponse.json({
      teamId: String(team._id),
      teamName: team.name,
      role: nextRole,
    });
  } catch (error) {
    console.error("assign user error:", error);
    return NextResponse.json({ message: "Error assigning user" }, { status: 500 });
  }
}

/** Take a user off their team — back to unassigned. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const busniess = await getOwnerBusniess();

  if (!busniess) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectToDatabase();

    const user = await User.findOne({ _id: id, busniess_id: busniess._id });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    await AgentProfile.deleteOne({ user_id: user._id });
    await clearLeadership(user._id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("unassign user error:", error);
    return NextResponse.json({ message: "Error unassigning user" }, { status: 500 });
  }
}

/** Drops the leader profile and any team still pointing at it. */
async function clearLeadership(userId: unknown) {
  const leader = await TeamLeaderProfile.findOne({ user_id: userId });
  if (!leader) return;

  await Team.updateMany({ team_leader_id: leader._id }, { team_leader_id: null });
  await TeamLeaderProfile.deleteOne({ _id: leader._id });
}
