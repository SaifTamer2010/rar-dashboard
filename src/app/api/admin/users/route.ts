import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const users = await User.find({}, "-password"); // Exclude password from the results
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Error fetching users" },
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
    const { name, password, role, telegramUsername, soundUrl, isActive } = await req.json();

    if (!name || !password) {
      return NextResponse.json(
        { message: "Name and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this name already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      password: hashedPassword,
      role: role || "user", // Default to 'user' if not provided
      telegramUsername: telegramUsername || null,
      soundUrl: soundUrl || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json(
      { message: "User created successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
}
