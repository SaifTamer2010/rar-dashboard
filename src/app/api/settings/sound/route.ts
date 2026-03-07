import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";

// Get current sound
export async function GET() {
  try {
    await connectToDatabase();
    const settings = await Settings.findOne();
    return NextResponse.json({ soundUrl: settings?.leadSoundUrl || null });
  } catch (error) {
    console.error("get sound error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Upload new sound as base64
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { base64, mimeType } = await req.json();

    if (!base64 || !mimeType) {
      return NextResponse.json({ error: "Missing file data" }, { status: 400 });
    }

    const dataUrl = `data:${mimeType};base64,${base64}`;

    await connectToDatabase();

    await Settings.findOneAndUpdate(
      {},
      { leadSoundUrl: dataUrl, updatedAt: new Date() },
      { upsert: true },
    );

    return NextResponse.json({ success: true, soundUrl: dataUrl });
  } catch (error) {
    console.error("upload sound error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Remove sound
export async function DELETE() {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    await Settings.findOneAndUpdate(
      {},
      { leadSoundUrl: null, updatedAt: new Date() },
      { upsert: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete sound error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
