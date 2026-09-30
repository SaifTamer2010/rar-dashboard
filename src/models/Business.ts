import mongoose, { Schema, Document ,Types} from "mongoose";

export interface IBusinessProfile extends Document {
 user_id: Types.ObjectId;
 company_name:string;
 /** Fallback chat, used when a team has not set one of its own. */
 telegram_chat_id:string | null;
 /** The business's own bot. Falls back to TELEGRAM_BOT_TOKEN when unset. */
 telegram_bot_token:string | null;
 createdAt:Date;
 updatedAt:Date;
}

const BusinessProfileSchema = new Schema<IBusinessProfile>({
  user_id: { type: Schema.Types.ObjectId,ref:'User' ,required:true,index:true},
  company_name: { type: String, required: true },
  telegram_chat_id: { type: String, default: null },
  // Secret. Never select this into anything that reaches the browser.
  telegram_bot_token: { type: String, default: null, select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/**
 * Registered as "Business" so `ref: "Business"` on User/Team/Campaign/Invite
 * actually resolves — it previously registered as "BusniessProfile" while every
 * ref pointed at "Busniess", a model that was never registered, so any
 * `.populate("busniess_id")` would have thrown.
 *
 * The collection is pinned to `busniessprofiles` on purpose. That is where the
 * live data sits; letting Mongoose derive it from the new model name would
 * point at an empty `businesses` collection and the business would appear to
 * vanish. Renaming the collection is a data migration, not a code change.
 */
export default mongoose.models.Business ||
  mongoose.model<IBusinessProfile>(
    "Business",
    BusinessProfileSchema,
    "busniessprofiles",
  );
