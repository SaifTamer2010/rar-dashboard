import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import Lead from "@/models/Lead";
import { getLeaderTeam } from "@/lib/teamlead";
import type { ITeam } from "@/models/Team";

/**
 * Loads a campaign only when it sits on the leader's own team.
 *
 * Everything here goes through this. The lookup is `_id` *and* `team_id`, so a
 * guessed id from another team comes back empty and the caller cannot tell it
 * apart from an id that does not exist — which is the point.
 */
async function findOwnCampaign(team: ITeam, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;

  await connectToDatabase();
  return Campaign.findOne({ _id: id, team_id: team._id });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const team = await getLeaderTeam();

  if (!team) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const campaign = await findOwnCampaign(team, id);

    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("teamlead campaign error:", error);
    return NextResponse.json(
      { message: "Error fetching campaign" },
      { status: 500 },
    );
  }
}

/** Rename one of the team's campaigns. The team it belongs to never moves. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const team = await getLeaderTeam();

  if (!team) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
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

    const campaign = await findOwnCampaign(team, id);

    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    const clash = await Campaign.findOne({
      name: trimmed,
      team_id: team._id,
      _id: { $ne: campaign._id },
    });

    if (clash) {
      return NextResponse.json(
        { message: "Your team already has a campaign with this name" },
        { status: 409 },
      );
    }

    campaign.name = trimmed;
    await campaign.save();

    return NextResponse.json({
      message: "Campaign updated successfully",
      campaign,
    });
  } catch (error) {
    console.error("teamlead update campaign error:", error);
    return NextResponse.json(
      { message: "Error updating campaign" },
      { status: 500 },
    );
  }
}

/**
 * Delete one of the team's campaigns.
 *
 * Leads point at a campaign by id, so a campaign that has already been logged
 * against stays put — deleting it would leave that history pointing at nothing.
 * The owner can still unassign it from the team.
 */
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
    const campaign = await findOwnCampaign(team, id);

    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    const leads = await Lead.countDocuments({ campaignId: campaign._id });

    if (leads > 0) {
      return NextResponse.json(
        {
          message: `This campaign has ${leads} lead${leads === 1 ? "" : "s"} logged against it and cannot be deleted.`,
        },
        { status: 409 },
      );
    }

    await campaign.deleteOne();

    return NextResponse.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("teamlead delete campaign error:", error);
    return NextResponse.json(
      { message: "Error deleting campaign" },
      { status: 500 },
    );
  }
}
