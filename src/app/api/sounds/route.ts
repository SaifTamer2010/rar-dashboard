import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Sound from "@/models/Sound";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Check for "me" query param to filter by current user
    const { searchParams } = new URL(req.url);
    const filterByMe = searchParams.get("me") === "true";
    
    const query = filterByMe ? { uploadedBy: new mongoose.Types.ObjectId(session.user.id) } : {};
    
    // Aggregation to ensure unique sounds by base64
    const sounds = await Sound.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: "$base64", // Group by content
          docId: { $first: "$_id" },
          name: { $first: "$name" },
          mimeType: { $first: "$mimeType" },
          createdAt: { $first: "$createdAt" },
          base64: { $first: "$base64" }
      }},
      { $sort: { createdAt: -1 } },
      { $project: {
          _id: "$docId",
          name: 1,
          mimeType: 1,
          createdAt: 1,
          base64: 1
      }}
    ]);
    
    return NextResponse.json({ sounds });
  } catch (error) {
    console.error("api/sounds GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
