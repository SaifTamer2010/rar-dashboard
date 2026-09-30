import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Invite from "@/models/Invite";
import { getLeaderTeam } from "@/lib/teamlead";

/** The leader's standing invite link — whoever uses it joins their team as an agent. */
export async function GET() {
  const team = await getLeaderTeam();

  if (!team) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    let invite = await Invite.findOne({ team_id: team._id });

    if (!invite) {
      invite = await Invite.create({
        busniess_id: team.busniess_id,
        team_id: team._id,
        token: crypto.randomUUID(),
      });
    }

    return NextResponse.json({ token: invite.token });
  } catch (error) {
    console.error("team invite error:", error);
    return NextResponse.json({ message: "Error creating invite" }, { status: 500 });
  }
}
