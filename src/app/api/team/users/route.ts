import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import AgentProfile from "@/models/agentProfile";
import { getLeaderTeam } from "@/lib/teamlead";

/**
 * Agents the leader may act on: the ones already on their team, plus the
 * unassigned agents of the same business. Leaders and owners never show up,
 * and agents on someone else's team stay out of reach.
 */
export async function GET() {
  const team = await getLeaderTeam();

  if (!team) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const agents = await User.find(
      { busniess_id: team.busniess_id, role: "agent" },
      "name email createdAt",
    ).sort({ createdAt: -1 });

    const profiles = await AgentProfile.find({
      user_id: { $in: agents.map((a) => a._id) },
    });
    const teamOf = new Map(profiles.map((p) => [String(p.user_id), String(p.team_id)]));

    const rows = agents
      .map((agent) => {
        const teamId = teamOf.get(String(agent._id)) ?? null;
        return {
          id: String(agent._id),
          name: agent.name,
          email: agent.email,
          onMyTeam: teamId === String(team._id),
          teamId,
        };
      })
      .filter((row) => row.onMyTeam || !row.teamId);

    return NextResponse.json({
      team: { id: String(team._id), name: team.name },
      users: rows,
    });
  } catch (error) {
    console.error("team users error:", error);
    return NextResponse.json({ message: "Error fetching agents" }, { status: 500 });
  }
}
