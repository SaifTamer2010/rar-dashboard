import mongoose, { Schema, Document } from "mongoose";

export interface ISound extends Document {
  name: string;
  base64: string;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SoundSchema = new Schema<ISound>({
  name: { type: String, required: true },
  base64: { type: String, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Sound ||
  mongoose.model<ISound>("Sound", SoundSchema);
