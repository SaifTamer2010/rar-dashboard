import mongoose, { Schema, Document ,Types} from "mongoose";

export interface IBusniessProfile extends Document {
 user_id: Types.ObjectId;
 company_name:String;
 createdAt:Date;
 updatedAt:Date;
}

const BusniessProfileSchema = new Schema<IBusniessProfile>({
  user_id: { type: Schema.Types.ObjectId,ref:'User' ,required:true,index:true},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Busniess ||
  mongoose.model<IBusniessProfile>("BusniessProfile", BusniessProfileSchema);
