import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import User from "@/models/User";
import { getSoundScope } from "../scope";

/**
 * The lead sound of one user — the dashboard plays it when that user's lead
 * lands. Only ever answered for someone inside the caller's own business, so a
 * user id guessed from another business gets a 403 instead of their audio.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const scope = await getSoundScope();
    if (!scope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const user = await User.findById(id).select("soundUrl busniess_id");
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!scope.isSuperAdmin) {
      if (!scope.busniessId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const sameBusiness = String(user.busniess_id ?? "") === String(scope.busniessId);

      // An owner carries no busniess_id of their own, so when the target isn't a
      // plain member check whether they own the caller's business instead.
      const isTheOwner =
        sameBusiness ||
        (await Business.exists({ _id: scope.busniessId, user_id: user._id })) !== null;

      if (!sameBusiness && !isTheOwner) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ soundUrl: user.soundUrl || null });
  } catch (error) {
    console.error("sound route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
