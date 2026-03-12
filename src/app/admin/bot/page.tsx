"use client";

import { useState, useEffect, useRef } from "react";
import { pusherClient } from "@/lib/pusher";

interface Message {
  _id: string;
  chatId: number;
  fromName: string;
  fromUsername: string | null;
  text: string;
  isFromBot: boolean;
  chatType: string;
  chatName: string | null;
  createdAt: string;
}

interface Conversation {
  chatId: number;
  chatName: string | null;
  chatType: string;
  messages: Message[];
  lastMessage: Message;
}

export default function BotPage() {
  const [conversations, setConversations] = useState<
    Record<number, Conversation>
  >({});
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/telegram/messages?limit=50&skip=0")
      .then((r) => r.json())
      .then((data) => {
        const convos: Record<number, Conversation> = {};
        (data.messages || []).reverse().forEach((msg: Message) => {
          if (!convos[msg.chatId]) {
            convos[msg.chatId] = {
              chatId: msg.chatId,
              chatName: msg.chatName,
              chatType: msg.chatType,
              messages: [],
              lastMessage: msg,
            };
          }
          convos[msg.chatId].messages.push(msg);
          convos[msg.chatId].lastMessage = msg;
        });
        setConversations(convos);
      });
  }, []);

  useEffect(() => {
    const channel = pusherClient.subscribe("chat-channel");

    channel.bind("new-message", (msg: Message) => {
      setConversations((prev) => {
        const updated = { ...prev };
        if (!updated[msg.chatId]) {
          updated[msg.chatId] = {
            chatId: msg.chatId,
            chatName: msg.chatName,
            chatType: msg.chatType,
            messages: [],
            lastMessage: msg,
          };
        }
        updated[msg.chatId] = {
          ...updated[msg.chatId],
          messages: [...updated[msg.chatId].messages, msg],
          lastMessage: msg,
        };
        return updated;
      });
    });

    return () => pusherClient.unsubscribe("chat-channel");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, selectedChatId]);

  async function handleReply() {
    if (!replyText.trim() || !selectedChatId) return;
    setSending(true);

    await fetch("/api/telegram/reply", {
      method: "POST",
      body: JSON.stringify({ chatId: selectedChatId, text: replyText }),
      headers: { "Content-Type": "application/json" },
    });

    setReplyText("");
    setSending(false);
  }

  const sortedConvos = Object.values(conversations).sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() -
      new Date(a.lastMessage.createdAt).getTime(),
  );

  const selectedConvo = selectedChatId ? conversations[selectedChatId] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar — conversation list */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold">Eldawly Inbox</h1>
          <p className="text-gray-400 text-xs mt-1">
            {sortedConvos.length} conversations
          </p>
        </div>

        <div className="flex-1 overflow-y-auto sticky left-0 top-0">
          {sortedConvos.length === 0 ? (
            <p className="text-gray-500 text-sm p-4">No messages yet</p>
          ) : (
            sortedConvos.map((convo) => (
              <button
                key={convo.chatId}
                onClick={() => setSelectedChatId(convo.chatId)}
                className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800 transition ${
                  selectedChatId === convo.chatId ? "bg-gray-800" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate">
                    {convo.chatType === "private" ? "👤" : "👥"}{" "}
                    {convo.chatName || `Chat ${convo.chatId}`}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(convo.lastMessage.createdAt).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
                <p className="text-gray-400 text-xs truncate">
                  {convo.lastMessage.isFromBot ? "🤖 " : ""}
                  {convo.lastMessage.text}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main — message thread */}
      <div className="flex-1 flex flex-col">
        {!selectedConvo ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-800 bg-gray-900 sticky h-screen left-0">
              <h2 className="font-bold">
                {selectedConvo.chatType === "private" ? "👤" : "👥"}{" "}
                {selectedConvo.chatName || `Chat ${selectedConvo.chatId}`}
              </h2>
              <p className="text-gray-400 text-xs">
                {selectedConvo.chatType} · ID: {selectedConvo.chatId}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedConvo.messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.isFromBot ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                      msg.isFromBot
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-white"
                    }`}
                  >
                    {!msg.isFromBot && (
                      <p className="text-xs text-gray-400 mb-1 font-medium">
                        {msg.fromName}
                        {msg.fromUsername ? ` @${msg.fromUsername}` : ""}
                      </p>
                    )}
                    <p>{msg.text}</p>
                    <p className="text-xs opacity-50 mt-1 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box */}
            <div className="p-4 border-t border-gray-800 bg-gray-900 flex gap-3">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder="Reply as bot..."
                className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleReply}
                disabled={sending || !replyText.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-6 py-3 rounded-xl font-medium transition"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
