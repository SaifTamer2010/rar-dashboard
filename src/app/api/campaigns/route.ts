import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const campaigns = await Campaign.find().sort({ name: 1 });
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("campaigns error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
