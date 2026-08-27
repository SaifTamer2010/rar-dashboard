import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeamLeaderProfile  extends Document {
 user_id:Types.ObjectId;
 team_id:Types.ObjectId;
 createdAt:Date;
 updatedAt:Date;
}

const TeamLeaderProfileSchema = new Schema<ITeamLeaderProfile>({
  user_id:{type:Schema.Types.ObjectId , ref:"User" , required:true , index:true},
  team_id:{type:Schema.Types.ObjectId , ref:"Team" , required:true , index:true},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
export default mongoose.models.TeamLeaderProfile ||
  mongoose.model<ITeamLeaderProfile>("TeamLeaderProfile", TeamLeaderProfileSchema);
