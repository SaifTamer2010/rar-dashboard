import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { APP_VERSION } from "@/lib/version";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentSeen = user.get("seenVersion", { strict: false }) || "0.0.0";
    const showModal = currentSeen !== APP_VERSION;

    return NextResponse.json({ showModal });
  } catch (error) {
    console.error("check-version GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Direct update to bypass schema caching issues
    const mongoose = (await import("mongoose")).default;
    await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(session.user.id) },
      { $set: { seenVersion: APP_VERSION } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("check-version POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
