import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Sound from "@/models/Sound";
import { getSoundScope, soundReadFilter } from "./scope";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const scope = await getSoundScope();
    if (!scope) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Check for "me" query param to filter by current user
    const { searchParams } = new URL(req.url);
    const filterByMe = searchParams.get("me") === "true";

    // The business filter comes off the session, never the request — the store
    // is private to one business, so a client-supplied id is not trusted here.
    const query: Record<string, unknown> = { ...soundReadFilter(scope) };
    if (filterByMe) {
      query.uploadedBy = new mongoose.Types.ObjectId(scope.userId);
    }

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
          base64: { $first: "$base64" },
          busniess_id: { $first: "$busniess_id" },
          uploadedBy: { $first: "$uploadedBy" }
      }},
      { $sort: { createdAt: -1 } },
      { $lookup: {
          from: "users",
          localField: "uploadedBy",
          foreignField: "_id",
          as: "uploader"
      }},
      { $unwind: { path: "$uploader", preserveNullAndEmptyArrays: true } },
      { $project: {
          _id: "$docId",
          name: 1,
          mimeType: 1,
          createdAt: 1,
          base64: 1,
          // Flagged so the UI can label the pre-scope leftovers and hide the
          // delete action on them.
          legacy: { $eq: [{ $ifNull: ["$busniess_id", null] }, null] },
          uploaderName: "$uploader.name"
      }}
    ]);

    // The store belongs to a business. A user attached to none gets the flag
    // so the UI can say so instead of showing an empty shared-looking library.
    return NextResponse.json({
      sounds,
      hasBusiness: scope.isSuperAdmin || !!scope.busniessId,
    });
  } catch (error) {
    console.error("api/sounds GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
