import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import User from "@/models/User";
import { decodeToken } from "@/app/api/auth";

type DecodedToken = { id: string };

export async function GET(req: NextRequest) {
  await connectDB();

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = (await decodeToken(token)) as DecodedToken | null;

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        Phoneno: user.Phoneno,
        allergies: user.allergies ?? [],
      },
    });
  } catch (err: any) {
    console.error("Error in /api/me:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
