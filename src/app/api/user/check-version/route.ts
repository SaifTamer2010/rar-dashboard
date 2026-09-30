import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { APP_VERSION } from "@/lib/version";
import { entriesSince } from "@/lib/changelog";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select("seenVersion").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const seenVersion: string = user.seenVersion || "0.0.0";
    // Send the releases themselves, so the dialog can show everything the user
    // missed rather than only the newest one.
    const entries = entriesSince(seenVersion);

    return NextResponse.json({
      showModal: entries.length > 0,
      version: APP_VERSION,
      seenVersion,
      entries,
    });
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

    await User.updateOne(
      { _id: session.user.id },
      { $set: { seenVersion: APP_VERSION } }
    );

    return NextResponse.json({ success: true, seenVersion: APP_VERSION });
  } catch (error) {
    console.error("check-version POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
