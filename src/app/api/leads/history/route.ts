import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Campaign from "@/models/Campaign";

export async function GET() {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const leads = await Lead.find({ userId: session.user.id })
      .populate("campaignId", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("history error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
