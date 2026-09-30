import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Sound from "@/models/Sound";
import { getSoundScope } from "@/app/api/sounds/scope";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const scope = await getSoundScope();
    if (!scope || !["super_admin", "busniess_owner"].includes(scope.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const sound = await Sound.findById(id);

    if (!sound) {
      return NextResponse.json({ error: "Sound not found" }, { status: 404 });
    }

    // Super admin deletes anywhere — deliberate, and the only global reach left.
    // An owner deletes only what their own business uploaded: never another
    // business's, and never a legacy sound with no business on it, since that
    // one is still visible to everybody.
    if (!scope.isSuperAdmin) {
      const sameBusiness =
        !!scope.busniessId &&
        !!sound.busniess_id &&
        String(sound.busniess_id) === String(scope.busniessId);

      if (!sameBusiness) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await sound.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin/sounds DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
