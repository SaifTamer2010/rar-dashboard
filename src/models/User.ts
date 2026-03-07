import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  password: string | null;
  soundUrl: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  password: { type: String, default: null },
  soundUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
