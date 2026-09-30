import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import TeamLeaderProfile from "@/models/TeamLeaderProfile";
import { auth } from "@/lib/auth";

/** The team the signed-in leader runs, or null when they aren't one. */
export async function getLeaderTeam() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "team_leader") {
    return null;
  }

  await connectToDatabase();

  const profile = await TeamLeaderProfile.findOne({ user_id: session.user.id }, "team_id");
  if (!profile?.team_id) return null;

  return Team.findById(profile.team_id);
}
