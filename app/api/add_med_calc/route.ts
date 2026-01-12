import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import Calc from "@/models/calc";
import z from "zod";
import mongoose from "mongoose";

const reqSchema = z.object({
  userId: z.string().min(1),
  med: z.object({
    medicineId: z.string().min(1),
    quantity: z.number().int().min(0), //0 for deletion
    cost: z.number().nonnegative(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) {
      console.log("Zod validation error ", parsed.error.format());
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, med } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }
    if (!mongoose.Types.ObjectId.isValid(med.medicineId)) {
      return NextResponse.json(
        { error: "Invalid medicineId format" },
        { status: 400 }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const medicineObjectId = new mongoose.Types.ObjectId(med.medicineId);

    //Handle deletion
    if (med.quantity === 0) {
      const deleted = await Calc.findOneAndUpdate(
        { userId: userObjectId },
        {
          $pull: { 
            medicines: { medicineId: medicineObjectId } 
          }
        },
        { new: true }
      );

      console.log("Medicine removed", med.medicineId);
      
      return NextResponse.json(
        { 
          message: "Medicine removed successfully", 
          data: deleted 
        },
        { status: 200 }
      );
    }

    //update existing medicine
    const updated = await Calc.findOneAndUpdate(
      {
        userId: userObjectId,
        "medicines.medicineId": medicineObjectId,
      },
      {
        $set: {
          "medicines.$.quantity": med.quantity,
          "medicines.$.cost": med.cost,
        },
      },
      { new: true }
    );

    if (updated) {
      console.log("Updated existing medicine:", med.medicineId);
      return NextResponse.json(
        { message: "Medicine updated successfully", data: updated },
        { status: 200 }
      );
    }

    //add med
    const added = await Calc.findOneAndUpdate(
      { userId: userObjectId },
      {
        $push: {
          medicines: {
            medicineId: medicineObjectId,
            quantity: med.quantity,
            cost: med.cost,
          },
        },
      },
      { new: true, upsert: true }
    );

    console.log("Added new medicine:", med.medicineId);
    
    return NextResponse.json(
      { message: "Medicine added successfully", data: added },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("API error", error);
    
    if (error.name === "CastError") {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}