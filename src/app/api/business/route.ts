import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import { auth } from "@/lib/auth";

/** The signed-in owner's business. Name only for now. */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const business = await Business.findOne({ user_id: session.user.id });

    if (!business) {
      return NextResponse.json({ message: "No business found" }, { status: 404 });
    }

    return NextResponse.json({ companyName: business.company_name });
  } catch (error) {
    console.error("Error fetching business:", error);
    return NextResponse.json({ message: "Error fetching business" }, { status: 500 });
  }
}
