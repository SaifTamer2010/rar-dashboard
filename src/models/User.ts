import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email:string;
  busniess_id: mongoose.Types.ObjectId | null;
  password: string | null;
  role: string;
  soundUrl: string;
  isActive: boolean;
  telegramUsername: string | null; // add this
  leadMessageTemplate: string | null;
  seenVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email:{type:String,required:true},
  busniess_id:{type:Schema.Types.ObjectId, ref:"Busniess", default:null, index:true},
  password: { type: String, default: null },
  soundUrl: { type: String, default: null },
  role: { type: String, enum: ["super_admin","busniess_owner","team_leader","agent"] }, 
  isActive: { type: Boolean, default: true },
  telegramUsername: { type: String, default: null }, // add this
  leadMessageTemplate: { type: String, default: null },
  seenVersion: { type: String, default: "0.0.0" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
