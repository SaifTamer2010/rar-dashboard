import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message;

    if (!message || !message.text) return NextResponse.json({ ok: true });

    await connectToDatabase();

    const saved = await Message.create({
      chatId: message.chat.id,
      messageId: message.message_id,
      fromName: message.from?.first_name || "Unknown",
      fromUsername: message.from?.username || null,
      text: message.text,
      isFromBot: false,
      chatType: message.chat.type,
      chatName: message.chat.title || message.chat.first_name || null,
    });

    // Broadcast to dashboard
    await pusherServer.trigger("chat-channel", "new-message", {
      _id: saved._id,
      chatId: saved.chatId,
      fromName: saved.fromName,
      fromUsername: saved.fromUsername,
      text: saved.text,
      chatType: saved.chatType,
      chatName: saved.chatName,
      createdAt: saved.createdAt,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("webhook error:", error);
    return NextResponse.json({ ok: true }); // always return 200 to Telegram
  }
}
