import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
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
    const { userId, campaignId, createdAt } = await req.json();

    if (!userId || !campaignId) {
      return NextResponse.json(
        { message: "User and Campaign are required" },
        { status: 400 }
      );
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { userId, campaignId, createdAt },
      { new: true }
    ).populate("userId", "name").populate("campaignId", "name");

    if (!updatedLead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Lead updated successfully", lead: updatedLead },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { message: "Error updating lead" },
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

    const deletedLead = await Lead.findByIdAndDelete(id);

    if (!deletedLead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Lead deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { message: "Error deleting lead" },
      { status: 500 }
    );
  }
}
