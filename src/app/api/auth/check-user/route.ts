import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  console.log("its working");
  const { name } = await req.json();
  console.log(name);

  if (!name)
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  await connectToDatabase();

  const user = await User.findOne({ name });
  const allUsers = await User.find({});
  console.log(allUsers);

  if (!user) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    hasPassword: !!user.password,
  });
}
