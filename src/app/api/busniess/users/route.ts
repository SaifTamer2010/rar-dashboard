import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import AgentProfile from "@/models/agentProfile";
import TeamLeaderProfile from "@/models/TeamLeaderProfile";
import Team from "@/models/Team";
import { getOwnerBusniess } from "@/lib/busniess";

/** Everyone who joined the business, with the team they landed in (or none). */
export async function GET() {
  const busniess = await getOwnerBusniess();

  if (!busniess) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const users = await User.find(
      { busniess_id: busniess._id },
      "name email role createdAt",
    ).sort({ createdAt: -1 });

    const userIds = users.map((u) => u._id);

    // Leaders carry a leader profile instead of an agent one — both mean "on a team".
    const profiles = [
      ...(await AgentProfile.find({ user_id: { $in: userIds } })),
      ...(await TeamLeaderProfile.find({ user_id: { $in: userIds } })),
    ];

    const teams = await Team.find({ busniess_id: busniess._id }, "name");
    const teamName = new Map(teams.map((t) => [String(t._id), t.name]));
    const teamOf = new Map(
      profiles.map((p) => [String(p.user_id), String(p.team_id)]),
    );

    return NextResponse.json({
      users: users.map((u) => {
        const teamId = teamOf.get(String(u._id)) ?? null;
        return {
          id: String(u._id),
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          teamId,
          teamName: teamId ? (teamName.get(teamId) ?? null) : null,
        };
      }),
    });
  } catch (error) {
    console.error("busniess users error:", error);
    return NextResponse.json({ message: "Error fetching users" }, { status: 500 });
  }
}
