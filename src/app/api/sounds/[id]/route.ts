import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    // console.log("Sound route hit, id:", id); // add this

    await connectToDatabase();
    const user = await User.findById(id).select("soundUrl");
    // console.log("User found:", user); // add this

    return NextResponse.json({ soundUrl: user?.soundUrl || null });
  } catch (error) {
    console.error("sound route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
