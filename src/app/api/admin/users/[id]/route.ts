import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { isRole } from "@/lib/roles";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { password } = body;
    const updateFields: Record<string, unknown> = {};
    const allowedFields = ["name", "email", "role", "isActive","telegramUsername", "soundUrl"];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateFields[field] = body[field];
      }
    });

    if (updateFields.role !== undefined && !isRole(updateFields.role)) {
      return NextResponse.json({ message: "Unknown role" }, { status: 400 });
    }

    // Email is the identity key. Normalize it the way the schema does, then
    // reject a collision here rather than letting the unique index throw a
    // duplicate-key error that surfaces as a bare 500.
    if (updateFields.email !== undefined) {
      const normalizedEmail = String(updateFields.email).trim().toLowerCase();

      if (!EMAIL_RE.test(normalizedEmail)) {
        return NextResponse.json({ message: "Enter a valid email" }, { status: 400 });
      }

      const taken = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (taken) {
        return NextResponse.json({ message: "That email is already taken" }, { status: 409 });
      }

      updateFields.email = normalizedEmail;
    }

    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }
    const updatedUser = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    }).select("-password"); // Exclude password from the returned object

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "User updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Error updating user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    // Log the detail, return a generic message — internal error text is not
    // something to hand back over the wire.
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Error deleting user" },
      { status: 500 }
    );
  }
}
