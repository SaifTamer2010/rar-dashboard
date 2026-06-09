import mongoose , { Schema, Document, Types } from "mongoose";

export interface IToken extends Document{
    user_id:Types.ObjectId;
    refresh_token: string;
    revoked:boolean;
    expires_at:Date;
    created_at:Date;
    updated_at:Date;
}

const TokenSchema = new Schema<IToken>(
    {
        user_id:{type:Schema.Types.ObjectId,ref:'User' , required:true , index:true},
        refresh_token: { type:String , required:true },
        revoked:{type:Boolean , default:false},
        expires_at:{type:Date , required:true , index:true},
    },
    { timestamps:{createdAt:'created_at' , updatedAt:"updated_at"}}
)

TokenSchema.index({ expires_at:1 }, { expireAfterSeconds:0 });

export default mongoose.models.Token || mongoose.model<IToken>("Token",TokenSchema)