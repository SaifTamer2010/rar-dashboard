import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const user = await User.findById(session.user.id).select(
      "name telegramUsername",
    );
    return NextResponse.json(user);
  } catch (error) {
    console.error("me error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
