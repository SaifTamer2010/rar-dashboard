import { NextRequest, NextResponse } from "next/server";
import { sendTelegramToBusniess } from "@/lib/telegram";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Busniess from "@/models/Busniess";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["super_admin", "busniess_owner"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Owners test their own chat; anyone else tests the business they belong to.
    const owned = await Busniess.findOne({ user_id: session.user.id }, "_id");
    const sender = owned ? null : await User.findById(session.user.id, "busniess_id");

    await sendTelegramToBusniess(owned?._id ?? sender?.busniess_id, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("send test message error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
