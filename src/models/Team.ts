import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeam extends Document {
  name:string;
 busniess_id:Types.ObjectId;
 team_leader_id:Types.ObjectId | null;
 /** This team's own Telegram chat. Lead shouts go here. */
 telegram_chat_id:string | null;
 createdAt:Date;
 updatedAt:Date;
}

const TeamSchema = new Schema<ITeam>({
  name:{type:String},
  busniess_id:{type:Schema.Types.ObjectId , ref:"Business" , required:true , index:true},
  team_leader_id:{type:Schema.Types.ObjectId , ref:"TeamLeaderProfile" , default:null , index:true},
  telegram_chat_id:{type:String , default:null},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
export default mongoose.models.Team ||
  mongoose.model<ITeam>("Team", TeamSchema);
