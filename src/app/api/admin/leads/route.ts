import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Campaign from "@/models/Campaign";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    await connectToDatabase();
    
    const [leads, total] = await Promise.all([
      Lead.find()
        .populate("userId", "name")
        .populate("campaignId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Lead.countDocuments()
    ]);

    return NextResponse.json({ 
      leads, 
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { message: "Error fetching leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { userId, campaignId, createdAt } = await req.json();

    if (!userId || !campaignId) {
      return NextResponse.json(
        { message: "User and Campaign are required" },
        { status: 400 }
      );
    }

    const newLead = await Lead.create({
      userId,
      campaignId,
      createdAt: createdAt || new Date(),
    });

    return NextResponse.json(
      { message: "Lead created successfully", lead: newLead },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { message: "Error creating lead" },
      { status: 500 }
    );
  }
}
