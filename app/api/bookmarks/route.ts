import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import z from "zod";

const reqSchema = z.object({
  userId: z.string(),
  medicineId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const parsedBody = reqSchema.safeParse(body);
        if (!parsedBody.success){
          return NextResponse.json(
            { error: "Invalid request data" },
            { status: 400 }
          );}

    const {userId,medicineId}=parsedBody.data;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 });
    }

    const medObjectId = new mongoose.Types.ObjectId(medicineId);

    const isFavorited = user.favorites
      .map((id: mongoose.Types.ObjectId) => id.toString())
      .includes(medObjectId.toString());

    if (isFavorited) 
    {
      user.favorites = user.favorites.filter(
        (id:mongoose.Types.ObjectId) => id.toString() !== medObjectId.toString()
      );
    } 
    else 
    {
      user.favorites.push(medObjectId);
    }

    await user.save();

    return NextResponse.json(
      {
        message: isFavorited
          ? "Medicine removed from favorites"
          : "Medicine added to favorites",
        favorites: user.favorites,
      },
      { status: 200 }
    );

}
catch(error){
    return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 }
        );
}
}