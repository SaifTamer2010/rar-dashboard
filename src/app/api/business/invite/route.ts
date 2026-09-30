import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Invite from "@/models/Invite";
import { getOwnerBusniess } from "@/lib/busniess";

/** The owner's standing invite link. Created on first ask, reused after. */
export async function GET() {
  const busniess = await getOwnerBusniess();

  if (!busniess) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    let invite = await Invite.findOne({ busniess_id: busniess._id });

    if (!invite) {
      invite = await Invite.create({
        busniess_id: busniess._id,
        token: crypto.randomUUID(),
      });
    }

    return NextResponse.json({ token: invite.token });
  } catch (error) {
    console.error("invite error:", error);
    return NextResponse.json({ message: "Error creating invite" }, { status: 500 });
  }
}
