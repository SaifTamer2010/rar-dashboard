import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  name: string;
  createdAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Campaign ||
  mongoose.model<ICampaign>("Campaign", CampaignSchema);
