import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";

export async function GET() {
  try {
    await connectToDatabase();
    const campaigns = await Campaign.find().sort({ name: 1 });
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("campaigns error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
