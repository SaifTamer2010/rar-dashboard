import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
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

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Campaign name is required" },
        { status: 400 }
      );
    }

    const existingCampaign = await Campaign.findOne({ name });
    if (existingCampaign) {
      return NextResponse.json(
        { message: "Campaign with this name already exists" },
        { status: 409 }
      );
    }

    const newCampaign = await Campaign.create({ name });

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
