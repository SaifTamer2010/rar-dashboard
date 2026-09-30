import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import Business from "@/models/Business";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const campaigns = await Campaign.find().sort({ name: 1 });
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { message: "Error fetching campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { name, busniess_id } = await req.json();

    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName) {
      return NextResponse.json(
        { message: "Campaign name is required" },
        { status: 400 }
      );
    }

    // The schema marks busniess_id required. This route used to create with
    // `{ name }` alone, which threw a ValidationError on every call — so super
    // admin campaign creation never worked. The super admin is the one role not
    // scoped to a business, so the target has to come in on the body.
    if (!busniess_id || !mongoose.isValidObjectId(busniess_id)) {
      return NextResponse.json(
        { message: "Pick the business this campaign belongs to" },
        { status: 400 }
      );
    }

    const business = await Business.findById(busniess_id).select("_id");
    if (!business) {
      return NextResponse.json({ message: "Business not found" }, { status: 404 });
    }

    // Names only have to be unique inside a business — two companies may both
    // run a "Spring Outbound".
    const existingCampaign = await Campaign.findOne({
      name: trimmedName,
      busniess_id: business._id,
    });
    if (existingCampaign) {
      return NextResponse.json(
        { message: "That business already has a campaign with this name" },
        { status: 409 }
      );
    }

    // team_id stays null: the owner assigns it to a team from their teams page.
    const newCampaign = await Campaign.create({
      name: trimmedName,
      busniess_id: business._id,
    });

    return NextResponse.json(
      { message: "Campaign created successfully", campaign: newCampaign },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { message: "Error creating campaign" },
      { status: 500 }
    );
  }
}
