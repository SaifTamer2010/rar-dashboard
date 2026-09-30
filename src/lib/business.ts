import { connectToDatabase } from "@/lib/mongodb";
import Busniess from "@/models/Busniess";
import { auth } from "@/lib/auth";

/** Resolves the business owned by the signed-in owner, or null when they aren't one. */
export async function getOwnerBusniess() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "busniess_owner") {
    return null;
  }

  await connectToDatabase();
  return Busniess.findOne({ user_id: session.user.id });
}
