import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInvite extends Document {
  busniess_id: Types.ObjectId;
  token: string;
  createdAt: Date;
}

/** One standing invite link per business — the lobby code the owner shares. */
const InviteSchema = new Schema<IInvite>({
  busniess_id: { type: Schema.Types.ObjectId, ref: "Busniess", required: true, index: true },
  token: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Invite ||
  mongoose.model<IInvite>("Invite", InviteSchema);
