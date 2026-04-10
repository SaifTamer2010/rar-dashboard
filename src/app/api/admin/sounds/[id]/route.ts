import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Sound from "@/models/Sound";
import { auth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    
    const deletedSound = await Sound.findByIdAndDelete(id);
    
    if (!deletedSound) {
      return NextResponse.json({ error: "Sound not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin/sounds DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
