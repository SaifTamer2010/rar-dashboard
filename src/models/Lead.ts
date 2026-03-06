import mongoose, { Schema, Document } from "mongoose";

export interface ILead extends Document {
  userId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LeadSchema = new Schema<ILead>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Lead ||
  mongoose.model<ILead>("Lead", LeadSchema);
