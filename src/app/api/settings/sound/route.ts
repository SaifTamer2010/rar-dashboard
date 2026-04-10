import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Sound from "@/models/Sound";

export async function GET() {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const user = await User.findById(session.user.id);
    return NextResponse.json({ soundUrl: user?.soundUrl || null });
  } catch (error) {
    console.error("settings/sound GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { base64, mimeType, name } = await req.json();
    
    if (!base64 || !mimeType) {
      return NextResponse.json({ error: "Missing file data" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Check for duplicate with current sound
    const user = await User.findById(session.user.id);
    if (user?.soundUrl && user.soundUrl.includes("base64,")) {
      const currentBase64 = user.soundUrl.split("base64,")[1];
      if (currentBase64 === base64) {
        return NextResponse.json({ error: "Duplicate: This is already your current sound!" }, { status: 400 });
      }
    }
    
    // Updates user's personal sound
    const dataUrl = `data:${mimeType};base64,${base64}`;
    await User.findByIdAndUpdate(session.user.id, { soundUrl: dataUrl });

    // Also save to global sound store
    try {
      const existingSound = await Sound.findOne({ base64 });
      if (!existingSound) {
        await Sound.create({
          name: name || "Custom Sound",
          base64: base64,
          mimeType: mimeType,
          uploadedBy: session.user.id
        });
      }
    } catch (err) {
      console.error("Failed to save to global sound store:", err);
      // We don't fail the user upload if global store save fails
    }

    return NextResponse.json({ success: true, soundUrl: dataUrl });
  } catch (error) {
    console.error("settings/sound POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    await User.findByIdAndUpdate(session.user.id, { soundUrl: null });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("settings/sound DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
