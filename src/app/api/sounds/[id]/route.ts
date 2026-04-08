import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const user = await User.findById(id).select("soundUrl");

    return NextResponse.json({ soundUrl: user?.soundUrl || null });
  } catch (error) {
    console.error("sound route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
