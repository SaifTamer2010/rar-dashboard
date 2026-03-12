import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";

export async function GET() {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const messages = await Message.find().sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
