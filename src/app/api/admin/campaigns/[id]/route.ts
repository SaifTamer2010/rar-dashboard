import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import { auth } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Campaign name is required" },
        { status: 400 }
      );
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!updatedCampaign) {
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Campaign updated successfully", campaign: updatedCampaign },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { message: "Error updating campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;

    const deletedCampaign = await Campaign.findByIdAndDelete(id);

    if (!deletedCampaign) {
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Campaign deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { message: "Error deleting campaign" },
      { status: 500 }
    );
  }
}
