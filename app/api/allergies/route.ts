import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import User from "@/models/User";
import { decodeToken } from "@/app/api/auth";

type DecodedToken = { id: string };

// GET /api/allergies -> return current allergies array
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

    return NextResponse.json(
      { allergies: user.allergies || [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in GET /api/allergies:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/allergies -> add a new allergy (string) to allergies array
export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => null);
    if (!body || typeof body.allergy !== "string") {
      return NextResponse.json(
        { error: "Allergy is required and must be a string" },
        { status: 400 }
      );
    }

    const allergy = body.allergy.trim();
    if (!allergy) {
      return NextResponse.json(
        { error: "Allergy cannot be empty" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { $addToSet: { allergies: allergy } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Allergy added successfully",
        allergies: updatedUser.allergies || [],
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error in POST /api/allergies:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/allergies -> remove an allergy from the array
export async function DELETE(req: NextRequest) {
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

    const body = await req.json().catch(() => null);
    if (!body || typeof body.allergy !== "string") {
      return NextResponse.json(
        { error: "Allergy is required and must be a string" },
        { status: 400 }
      );
    }

    const allergy = body.allergy.trim();
    if (!allergy) {
      return NextResponse.json(
        { error: "Allergy cannot be empty" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { $pull: { allergies: allergy } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Allergy removed successfully",
        allergies: updatedUser.allergies || [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in DELETE /api/allergies:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/allergies -> replace entire allergies array
export async function PUT(req: NextRequest) {
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

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.allergies)) {
      return NextResponse.json(
        { error: "Allergies array is required" },
        { status: 400 }
      );
    }

    const allergies = body.allergies
      .filter((a: any) => typeof a === "string")
      .map((a: string) => a.trim())
      .filter((a: string) => a.length > 0);

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { allergies },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Allergies updated successfully",
        allergies: updatedUser.allergies || [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in PUT /api/allergies:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}