import mongoose, { Schema, Document } from "mongoose";

export interface ISound extends Document {
  name: string;
  base64: string;
  mimeType: string;
  /**
   * The business the sound belongs to. Sounds are private to one business —
   * only its members list, preview and apply them.
   *
   * `null` means a legacy sound, uploaded before the store was scoped. Those
   * stay readable by everyone so nobody's library silently empties, but they
   * can never be written or deleted by a business owner — only a super admin.
   * Every new upload gets a real id, so the legacy set only shrinks.
   */
  busniess_id: mongoose.Types.ObjectId | null;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SoundSchema = new Schema<ISound>({
  name: { type: String, required: true },
  base64: { type: String, required: true },
  mimeType: { type: String, required: true },
  busniess_id: { type: Schema.Types.ObjectId, ref: "Business", default: null, index: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Sound ||
  mongoose.model<ISound>("Sound", SoundSchema);
