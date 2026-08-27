import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeam extends Document {
  name:String;
 busniess_id:Types.ObjectId;
 team_leader_id:Types.ObjectId | null;
 createdAt:Date;
 updatedAt:Date;
}

const TeamSchema = new Schema<ITeam>({
  name:{type:String},
  busniess_id:{type:Schema.Types.ObjectId , ref:"Busniess" , required:true , index:true},
  team_leader_id:{type:Schema.Types.ObjectId , ref:"TeamLeaderProfile" , default:null , index:true},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
export default mongoose.models.Team ||
  mongoose.model<ITeam>("Team", TeamSchema);
