import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import Campaign from "@/models/Campaign";
import { getOwnerBusniess } from "@/lib/busniess";

/** Hand a campaign to this team. Moves it if another team had it. */
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
    const { campaignId, newCampaignName } = await req.json();

    await connectToDatabase();

    const team = await Team.findOne({ _id: id, busniess_id: busniess._id });
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 });
    }

    if (newCampaignName?.trim()) {
      const created = await Campaign.create({
        name: newCampaignName.trim(),
        busniess_id: busniess._id,
        team_id: team._id,
      });
      return NextResponse.json({ id: String(created._id), name: created.name });
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      busniess_id: busniess._id,
    });

    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    campaign.team_id = team._id;
    await campaign.save();

    return NextResponse.json({ id: String(campaign._id), name: campaign.name });
  } catch (error) {
    console.error("assign campaign error:", error);
    return NextResponse.json({ message: "Error assigning campaign" }, { status: 500 });
  }
}

/** Pull a campaign off this team. It stays in the business, unassigned. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const busniess = await getOwnerBusniess();

  if (!busniess) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const campaignId = req.nextUrl.searchParams.get("campaignId");

    await connectToDatabase();

    const campaign = await Campaign.findOne({
      _id: campaignId,
      busniess_id: busniess._id,
      team_id: id,
    });

    if (!campaign) {
      return NextResponse.json({ message: "Campaign not found" }, { status: 404 });
    }

    campaign.team_id = null;
    await campaign.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("remove campaign error:", error);
    return NextResponse.json({ message: "Error removing campaign" }, { status: 500 });
  }
}
