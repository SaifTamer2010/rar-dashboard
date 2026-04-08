import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  password: string | null;
  soundUrl: string;
  role: string;
  telegramUsername: string | null; // add this
  leadMessageTemplate: string | null;
  seenVersion: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  password: { type: String, default: null },
  soundUrl: { type: String, default: null },
  role: { type: String, enum: ["admin", "user", "viewer"], default: "user" },
  telegramUsername: { type: String, default: null }, // add this
  leadMessageTemplate: { type: String, default: null },
  seenVersion: { type: String, default: "0.0.0" },
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
