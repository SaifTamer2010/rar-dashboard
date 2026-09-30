import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Sound from "@/models/Sound";
import { getSoundScope } from "@/app/api/sounds/scope";

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
    const scope = await getSoundScope();
    if (!scope)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { base64, mimeType, name } = await req.json();

    if (!base64 || !mimeType) {
      return NextResponse.json({ error: "Missing file data" }, { status: 400 });
    }

    await connectToDatabase();

    // Check for duplicate with current sound
    const user = await User.findById(scope.userId);
    if (user?.soundUrl && user.soundUrl.includes("base64,")) {
      const currentBase64 = user.soundUrl.split("base64,")[1];
      if (currentBase64 === base64) {
        return NextResponse.json({ error: "Duplicate: This is already your current sound!" }, { status: 400 });
      }
    }

    // Updates user's personal sound
    const dataUrl = `data:${mimeType};base64,${base64}`;
    await User.findByIdAndUpdate(scope.userId, { soundUrl: dataUrl });

    // Also save to this business's sound store. A super admin belongs to no
    // business, and neither does a user who hasn't been attached to one yet —
    // both write a legacy (unscoped) row rather than landing in someone else's
    // library by accident.
    try {
      // Deduped inside the business only, so two businesses can each hold their
      // own copy of the same clip without one blocking the other.
      const existingSound = await Sound.findOne({
        base64,
        busniess_id: scope.busniessId ?? null,
      });
      if (!existingSound) {
        await Sound.create({
          name: name || "Custom Sound",
          base64: base64,
          mimeType: mimeType,
          busniess_id: scope.busniessId ?? null,
          uploadedBy: scope.userId
        });
      }
    } catch (err) {
      console.error("Failed to save to the business sound store:", err);
      // We don't fail the user upload if the store save fails
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
