import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import AgentProfile from "@/models/agentProfile";
import TeamLeaderProfile from "@/models/TeamLeaderProfile";
import User from "@/models/User";

/** The team the signed-in user belongs to, or null when they are on none. */
export async function getViewerTeamId(userId?: string | null) {
  if (!userId) return null;

  await connectToDatabase();

  const agent = await AgentProfile.findOne({ user_id: userId }, "team_id");
  if (agent?.team_id) return agent.team_id as Types.ObjectId;

  const leader = await TeamLeaderProfile.findOne({ user_id: userId }, "team_id");
  if (leader?.team_id) return leader.team_id as Types.ObjectId;

  return null;
}

/**
 * Active users on a team that actually log leads — role "agent" only.
 * Team leaders, owners and everyone else stay out of the dashboard.
 */
export async function getTeamAgentIds(teamId: Types.ObjectId | string) {
  await connectToDatabase();

  const profiles = await AgentProfile.find({ team_id: teamId }, "user_id");
  const userIds = profiles.map((p) => p.user_id);

  const agents = await User.find(
    { _id: { $in: userIds }, role: "agent", isActive: true },
    "_id",
  );

  return agents.map((a) => a._id as Types.ObjectId);
}
