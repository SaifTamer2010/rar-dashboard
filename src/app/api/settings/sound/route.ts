import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const user = await User.findById(session.user.id);
    return NextResponse.json({ soundUrl: user?.soundUrl || null });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
    await User.findByIdAndUpdate(session.user.id, { soundUrl: dataUrl });

    return NextResponse.json({ success: true, soundUrl: dataUrl });
  } catch (error) {
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
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
