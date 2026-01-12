import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import User from "@/models/User";
import { decodeToken } from "@/app/api/auth";

type DecodedToken = { id: string };

export async function PUT(req: NextRequest) {
  await connectDB();

  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = (await decodeToken(token)) as DecodedToken | null;
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { Phoneno: Number(phone) },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Phone number updated successfully",
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          Phoneno: updatedUser.Phoneno,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error updating phone:", err);

    // If decodeToken threw a TokenExpiredError, return 401
    if (err.name === "TokenExpiredError") {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
