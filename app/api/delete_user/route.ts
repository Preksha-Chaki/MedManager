import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/api/mongodb";
import User from "@/models/User";
import Calc from "@/models/calc";
import Prescription from "@/models/Prescription";
import { decodeToken } from "@/app/api/auth";

export async function DELETE(req: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("UserId");

  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decodedToken = await decodeToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "user ID is required" },
        { status: 400 }
      );
    }

    // Optional: only allow self-delete
    // if (decodedToken.id !== userId) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If your calc.userId is ObjectId, cast userId; otherwise plain string is fine.
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Delete related data
    await Calc.deleteMany({ userId: userObjectId });
    await Prescription.deleteMany({ userId }); // userId in Prescription is string

    // Delete the user (also removes favs and other embedded fields)
    await User.findByIdAndDelete(userId);

    return NextResponse.json(
      { message: "User and related data deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
