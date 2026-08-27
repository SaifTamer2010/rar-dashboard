import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICampaign extends Document {
  name: string;
  team_id:Types.ObjectId;
  busniess_id:Types.ObjectId;
  createdAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  name: { type: String, required: true},
  team_id:{type:Schema.Types.ObjectId , ref:"Team" , required:true , index:true},
  busniess_id:{type:Schema.Types.ObjectId , ref:"Busniess" , required:true , index:true},
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Campaign ||
  mongoose.model<ICampaign>("Campaign", CampaignSchema);
