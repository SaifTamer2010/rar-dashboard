import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import { auth } from "@/lib/auth";

/**
 * Every business, for the super admin's pickers.
 *
 * A campaign is required to belong to a business, and the super admin is the
 * one role that is not scoped to one — so any admin screen that creates a
 * campaign has to ask which business it lands in. Id and name only; the bot
 * token on this model is `select: false` and must stay that way.
 */
export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const businesses = await Business.find({}, "company_name").sort({ company_name: 1 }).lean();

    return NextResponse.json({
      businesses: businesses.map((b) => ({
        _id: String(b._id),
        company_name: b.company_name,
      })),
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json({ message: "Error fetching businesses" }, { status: 500 });
  }
}
