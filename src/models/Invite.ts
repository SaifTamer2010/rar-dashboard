import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInvite extends Document {
  busniess_id: Types.ObjectId;
  team_id: Types.ObjectId | null;
  token: string;
  createdAt: Date;
}

/** A standing invite link — one per business, plus one per team for its leader. */
const InviteSchema = new Schema<IInvite>({
  busniess_id: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  team_id: { type: Schema.Types.ObjectId, ref: "Team", default: null, index: true },
  token: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Invite ||
  mongoose.model<IInvite>("Invite", InviteSchema);
