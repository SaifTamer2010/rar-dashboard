import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  leadSoundUrl: string | null;
  leadMessageTemplate: string | null;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  leadSoundUrl: { type: String, default: null },
  leadMessageTemplate: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
