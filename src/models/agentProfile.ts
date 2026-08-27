import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAgentProfile extends Document {
 user_id:Types.ObjectId;
 team_id:Types.ObjectId;
 createdAt:Date;
 updatedAt:Date;
}

const AgentProfileSchema = new Schema<IAgentProfile>({
  user_id:{type:Schema.Types.ObjectId , ref:"User" , required:true , index:true},
  team_id:{type:Schema.Types.ObjectId , ref:"Team" , required:true , index:true},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
export default mongoose.models.AgentProfile ||
  mongoose.model<IAgentProfile>("AgentProfile", AgentProfileSchema);
