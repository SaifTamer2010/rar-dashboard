import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  /**
   * The business these settings belong to. `null` is the legacy single global
   * document — still the only one written today, see the note below.
   */
  busniess_id: mongoose.Types.ObjectId | null;
  leadSoundUrl: string | null;
  leadMessageTemplate: string | null;
  updatedAt: Date;
}

/**
 * One row per business, like sounds (see models/Sound.ts). Readers ask for their
 * own `busniess_id` first and fall back to the `null` row, which is the single
 * pre-scoping document every business used to share; nothing writes a non-null
 * value yet, so today that fallback is what everyone still resolves to.
 */
const SettingsSchema = new Schema<ISettings>({
  busniess_id: { type: Schema.Types.ObjectId, ref: "Business", default: null, index: true },
  leadSoundUrl: { type: String, default: null },
  leadMessageTemplate: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
