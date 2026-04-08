import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import User from "@/models/User";
import { auth } from "@/lib/auth";

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

    return NextResponse.json({
      leadMessageTemplate: user.get("leadMessageTemplate", null, { strict: false }),
    });
  } catch (error) {
    console.error("settings config GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadMessageTemplate } = await req.json();

    await connectToDatabase();
    
    // Direct update to bypass any schema caching issues
    const mongoose = (await import("mongoose")).default;
    const res = await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(session.user.id) },
      { $set: { leadMessageTemplate: leadMessageTemplate || null } }
    );

    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      leadMessageTemplate
    });
  } catch (error) {
    console.error("settings config POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
