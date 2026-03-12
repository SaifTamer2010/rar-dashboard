import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  chatId: number;
  messageId: number;
  fromName: string;
  fromUsername: string | null;
  text: string;
  isFromBot: boolean;
  chatType: "private" | "group" | "supergroup";
  chatName: string | null;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatId: { type: Number, required: true },
  messageId: { type: Number, required: true },
  fromName: { type: String, required: true },
  fromUsername: { type: String, default: null },
  text: { type: String, required: true },
  isFromBot: { type: Boolean, default: false },
  chatType: {
    type: String,
    enum: ["private", "group", "supergroup"],
    required: true,
  },
  chatName: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
