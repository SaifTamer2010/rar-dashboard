import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    await connectToDatabase();

    // Make sure the lead belongs to this user
    const lead = await Lead.findOne({ _id: id, userId: session.user.id });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await lead.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete lead error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
