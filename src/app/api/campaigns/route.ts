import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import { auth } from "@/lib/auth";
import { getViewerTeamId } from "@/lib/team";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Agents only ever see the campaigns their own team was given.
    const teamId = await getViewerTeamId(session.user?.id);

    if (!teamId) {
      return NextResponse.json({ campaigns: [] });
    }

    const campaigns = await Campaign.find({ team_id: teamId }).sort({ name: 1 });
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("campaigns error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
