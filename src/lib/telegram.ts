import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import Team from "@/models/Team";

/**
 * Telegram routing.
 *
 * A business owns one bot. Each team under it owns one chat. A lead logged by
 * an agent is announced in that agent's team chat, so three teams get three
 * separate feeds instead of everything landing in one room.
 *
 * Both settings fall back: a team with no chat id of its own uses the
 * business-wide chat, and a business with no bot token of its own uses
 * TELEGRAM_BOT_TOKEN from the environment. That keeps every existing
 * single-team setup working untouched.
 */

/** Sends to an explicit chat with an explicit bot. Both are required. */
export async function sendTelegramMessage(
  message: string,
  chatId?: string | null,
  botToken?: string | null,
) {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;

  if (!token || !chatId) return { sent: false, reason: !token ? "no-token" : "no-chat" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      // Telegram puts the useful part in the body, not the status line.
      const body = await res.text();
      console.error("telegram sendMessage failed:", res.status, body);
      return { sent: false, reason: "telegram-error" as const, detail: body };
    }

    return { sent: true as const };
  } catch (error) {
    console.error("telegram sendMessage threw:", error);
    return { sent: false, reason: "network" as const };
  }
}

/** The bot token a business sends with, falling back to the shared env bot. */
export async function getBotToken(businessId: unknown) {
  if (!businessId) return process.env.TELEGRAM_BOT_TOKEN ?? null;

  // telegram_bot_token is `select: false`, so it has to be asked for by name.
  const business = await Business.findById(businessId)
    .select("+telegram_bot_token")
    .lean<{ telegram_bot_token?: string | null }>();

  return business?.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || null;
}

/**
 * Sends to a team's own chat. Falls back to the business chat when the team has
 * not been given one, so nothing goes silent mid-migration.
 */
export async function sendTelegramToTeam(teamId: unknown, message: string) {
  if (!teamId) return { sent: false, reason: "no-team" as const };

  await connectToDatabase();

  const team = await Team.findById(teamId)
    .select("telegram_chat_id busniess_id")
    .lean<{ telegram_chat_id?: string | null; busniess_id?: unknown }>();

  if (!team) return { sent: false, reason: "no-team" as const };

  let chatId = team.telegram_chat_id;

  if (!chatId) {
    const business = await Business.findById(team.busniess_id)
      .select("telegram_chat_id")
      .lean<{ telegram_chat_id?: string | null }>();
    chatId = business?.telegram_chat_id ?? null;
  }

  const token = await getBotToken(team.busniess_id);

  return sendTelegramMessage(message, chatId, token);
}

/** The business-wide chat — used for owner-level messages, not lead shouts. */
export async function sendTelegramToBusiness(businessId: unknown, message: string) {
  if (!businessId) return { sent: false, reason: "no-business" as const };

  await connectToDatabase();

  const business = await Business.findById(businessId)
    .select("telegram_chat_id")
    .lean<{ telegram_chat_id?: string | null }>();

  const token = await getBotToken(businessId);

  return sendTelegramMessage(message, business?.telegram_chat_id, token);
}

/**
 * Chat id discovery.
 *
 * A chat id is not shown anywhere inside Telegram, so an owner cannot look one
 * up by hand. The bot can: every message it can see arrives on its update queue
 * carrying the chat it was sent in. Add the bot to the group, send anything,
 * and the id falls out of getUpdates.
 *
 * Polling on purpose — a webhook would need a public URL, and Telegram refuses
 * getUpdates outright while one is registered on the same bot.
 */

/** A chat the bot has seen, in the shape the settings pages render. */
export type DiscoveredChat = {
  id: string;
  title: string;
  type: string;
  username?: string;
};

export type ChatDiscovery =
  | { ok: true; chats: DiscoveredChat[] }
  | {
      ok: false;
      reason: "no-token" | "bad-token" | "webhook-active" | "telegram-error" | "network";
    };

type RawChat = {
  id?: number | string;
  type?: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

/**
 * Every update kind that carries a chat worth listing. `my_chat_member` is the
 * important one — it fires the moment the bot is added to a group, so the id
 * shows up even if nobody has typed anything yet. It is off by default, hence
 * the explicit list.
 */
const CHAT_UPDATES = [
  "message",
  "edited_message",
  "channel_post",
  "edited_channel_post",
  "my_chat_member",
  "chat_member",
] as const;

type TelegramUpdate = Partial<Record<(typeof CHAT_UPDATES)[number], { chat?: RawChat }>>;

/** Groups and channels have a title; private chats have a person's name. */
function chatLabel(chat: RawChat) {
  if (chat.title) return chat.title;

  const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ");
  if (name) return name;

  return chat.username ? `@${chat.username}` : "Unnamed chat";
}

/** Lists the distinct chats a bot has seen, newest first. */
export async function discoverTelegramChats(
  botToken?: string | null,
): Promise<ChatDiscovery> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;

  if (!token) return { ok: false, reason: "no-token" };

  const query = new URLSearchParams({
    limit: "100",
    allowed_updates: JSON.stringify(CHAT_UPDATES),
  });

  let res: Response;

  try {
    // No `offset`: passing one confirms the updates and Telegram drops them, so
    // a second click would come back empty. Reading without it is harmless.
    res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?${query}`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("telegram getUpdates threw:", error);
    return { ok: false, reason: "network" };
  }

  const body = (await res.json().catch(() => null)) as {
    ok?: boolean;
    result?: TelegramUpdate[];
    description?: string;
  } | null;

  if (!res.ok || !body?.ok) {
    const description = body?.description ?? "";

    // Log the status and Telegram's own words — never the URL, which carries
    // the token.
    console.error("telegram getUpdates failed:", res.status, description);

    if (res.status === 409 || /webhook is active/i.test(description)) {
      return { ok: false, reason: "webhook-active" };
    }

    if (res.status === 401 || res.status === 404) {
      return { ok: false, reason: "bad-token" };
    }

    return { ok: false, reason: "telegram-error" };
  }

  const seen = new Map<string, DiscoveredChat>();

  // Updates come back oldest first; walk backwards so the chat the owner just
  // messaged sits at the top of the list.
  for (const update of [...(body.result ?? [])].reverse()) {
    for (const kind of CHAT_UPDATES) {
      const chat = update[kind]?.chat;

      if (!chat?.id || seen.has(String(chat.id))) continue;

      seen.set(String(chat.id), {
        id: String(chat.id),
        title: chatLabel(chat),
        type: chat.type ?? "unknown",
        ...(chat.username ? { username: chat.username } : {}),
      });
    }
  }

  return { ok: true, chats: [...seen.values()] };
}

/** Why a lookup came back empty-handed, in words the owner can act on. */
export function chatDiscoveryError(reason: string) {
  switch (reason) {
    case "no-token":
      return "No Telegram bot is configured yet. Create one with @BotFather and save its token above first.";
    case "bad-token":
      return "Telegram rejected this bot token. Paste the token @BotFather gave you again, then try once more.";
    case "webhook-active":
      return "This bot has a webhook registered, so its messages cannot be read here. Remove the webhook (call deleteWebhook on the bot) and try again.";
    case "telegram-error":
      return "Telegram would not hand back this bot's messages. Wait a moment and try again.";
    default:
      return "Could not reach Telegram. Check your connection and try again.";
  }
}

/**
 * Telegram states the real problem in the body of a rejected send. Translating
 * the few that a person can actually act on beats showing them "Bad Request".
 */
function sendRejection(detail?: string) {
  const text = detail ?? "";

  if (/chat not found/i.test(text)) {
    return "Telegram does not know that chat id. Use “Find my chat ID” to pick the group instead of typing the id.";
  }

  if (/(kicked|bot was blocked|not a member)/i.test(text)) {
    return "The bot is not in that chat any more. Add it back to the group, then try again.";
  }

  if (/not enough rights|have no rights/i.test(text)) {
    return "The bot is in that chat but is not allowed to post. Give it permission to send messages.";
  }

  if (/chat_id is empty|invalid.*chat/i.test(text)) {
    return "That chat id is not valid. A chat id is a number, and group ids start with a minus.";
  }

  return "Telegram rejected the message. Check the chat id, and that the bot is in that chat and has not been removed or muted.";
}

/** Turns a send failure into something worth showing a person. */
export function telegramError(reason?: string, detail?: string) {
  switch (reason) {
    case "no-chat":
      return "No Telegram chat is set for this team yet. Ask the owner to add one in Teams.";
    case "no-token":
      return "No Telegram bot is configured. Add a bot token in business settings.";
    case "no-team":
      return "You are not on a team, so there is no chat to send to.";
    case "no-business":
      return "No business is linked to this account.";
    case "bad-token":
      return "Telegram rejected this bot token. Paste the token @BotFather gave you again in business settings.";
    case "webhook-active":
      return "This bot has a webhook registered, so it cannot be polled. Remove the webhook (call deleteWebhook on the bot) and try again.";
    case "telegram-error":
      return sendRejection(detail);
    default:
      return "Could not reach Telegram. Check your connection and try again.";
  }
}
