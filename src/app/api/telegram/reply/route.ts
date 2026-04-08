import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { chatId, text } = await req.json();

    if (!chatId || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Send via Telegram bot
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      },
    );

    const data = await res.json();
    if (!data.ok) {
      return NextResponse.json({ error: "Telegram error" }, { status: 500 });
    }

    // Save bot reply to DB
    await connectToDatabase();
    const saved = await Message.create({
      chatId,
      messageId: data.result.message_id,
      fromName: "Bot",
      fromUsername: null,
      text,
      isFromBot: true,
      chatType: data.result.chat.type,
      chatName: data.result.chat.title || data.result.chat.first_name || null,
    });

    await pusherServer.trigger("chat-channel", "new-message", {
      _id: saved._id,
      chatId: saved.chatId,
      fromName: saved.fromName,
      text: saved.text,
      isFromBot: true,
      chatType: saved.chatType,
      chatName: saved.chatName,
      createdAt: saved.createdAt,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
