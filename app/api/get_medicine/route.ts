import { NextResponse } from "next/server";
import { connectDB } from "../mongodb";
import Med from "@/models/medicine";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const term = searchParams.get("term") || "";
    const type = searchParams.get("type") || "name";

    let filter = {};

    if (term) {
  if (type === "name") {
    filter = { name: { $regex: term, $options: "i" } };
  } else if (type === "short_composition") {
    filter = {
      $or: [
        { short_composition1: { $regex: term, $options: "i" } },
        { short_composition2: { $regex: term, $options: "i" } },
      ],
    };
  } else if (type === "manufacturer") {
    filter = { manufacturer_name: { $regex: term, $options: "i" } };
  }
}


    const meds = await Med.find(filter).limit(30); 

    return NextResponse.json({ data: meds }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

