import { connectToDatabase } from "@/lib/mongodb";
import Busniess from "@/models/Busniess";

/** Sends to an explicit chat id. The bot token still comes from the env. */
export async function sendTelegramMessage(message: string, chatId?: string | null) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  });
}

/** Every business has its own chat — messages go where that business set them. */
export async function sendTelegramToBusniess(
  busniessId: unknown,
  message: string,
) {
  if (!busniessId) return;

  await connectToDatabase();

  const busniess = await Busniess.findById(busniessId, "telegram_chat_id");

  await sendTelegramMessage(message, busniess?.telegram_chat_id);
}
