import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    await connectToDatabase();

    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments();

    return NextResponse.json({ messages, total });
  } catch (error) {
    console.error("messages error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
