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

// Every read of this collection is "recent leads for a set of X", and it had no
// index at all — the dashboard stats, the history list and the shame-bell
// aggregation were all collection scans that grow with the whole company.
LeadSchema.index({ campaignId: 1, createdAt: -1 });
LeadSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Lead ||
  mongoose.model<ILead>("Lead", LeadSchema);
