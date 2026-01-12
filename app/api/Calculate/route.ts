import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import { z } from "zod";
import mongoose from "mongoose";
import calc from "@/models/calc";

const FrequencyUnitSchema = z.enum(["DAY", "WEEK", "MONTH"]);

const reqSchema = z.object({
  userId: z.string().min(1),
  fromDate: z.string().min(1), // ISO date string
  toDate: z.string().min(1),   // ISO date string
  medicines: z
    .array(
      z.object({
        medicineId: z.string().min(1),
        pricePerUnit: z.number().positive(),
        quantityPerDose: z.number().positive(), // Units per dose

        frequency: z.number().int().positive(),        // times per unit
        frequencyUnit: FrequencyUnitSchema,            // DAY | WEEK | MONTH
      })
    )
    .min(1, "At least one medicine is required"),
});

// helper to convert frequency per unit → per-day frequency
const toPerDayFrequency = (
  frequency: number,
  unit: "DAY" | "WEEK" | "MONTH"
) => {
  if (unit === "DAY") return frequency;
  if (unit === "WEEK") return frequency / 7;
  if (unit === "MONTH") return frequency / 30; // simple approximation
  return frequency;
};

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const parsed = reqSchema.safeParse(body);

    if (!parsed.success) {
      console.error("❌ Validation error:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, fromDate, toDate, medicines } = parsed.data;

    // ✅ Validate dates
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { error: "End date must be after or equal to start date" },
        { status: 400 }
      );
    }

    // ✅ Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 }
      );
    }

    for (const med of medicines) {
      if (!mongoose.Types.ObjectId.isValid(med.medicineId)) {
        return NextResponse.json(
          { error: `Invalid medicineId format: ${med.medicineId}` },
          { status: 400 }
        );
      }
    }

    // ✅ Calculate number of days (inclusive)
    const diffInMs = endDate.getTime() - startDate.getTime();
    const numDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;

    console.log(`📅 Calculating for ${numDays} days (${fromDate} to ${toDate})`);

    // ✅ Calculate quantity and cost for each medicine using frequency/unit
    const calculatedMedicines = medicines.map((med) => {
      const perDayFreq = toPerDayFrequency(med.frequency, med.frequencyUnit);
      const totalDoses = perDayFreq * numDays;
      const quantity = med.quantityPerDose * totalDoses;
      const cost = med.pricePerUnit * quantity;

      console.log(
        `💊 ${med.medicineId}: ${med.quantityPerDose} units × ${med.frequency} times/${med.frequencyUnit} over ${numDays} days = ${quantity.toFixed(
          2
        )} total units, Cost: ₹${cost.toFixed(2)}`
      );

      return {
        medicineId: new mongoose.Types.ObjectId(med.medicineId),
        quantity: parseFloat(quantity.toFixed(2)),
        cost: parseFloat(cost.toFixed(2)),
        frequency: med.frequency,
        frequencyUnit: med.frequencyUnit,
      };
    });

    // ✅ Calculate total cost
    const finalCost = calculatedMedicines.reduce(
      (sum, med) => sum + med.cost,
      0
    );

    console.log(`💰 Total cost: ₹${finalCost.toFixed(2)}`);

    // ✅ Upsert calculation for this user (replace previous one)
    const calculation = await calc.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) }, // one calc per user
      {
        $set: {
          fromDate: startDate,
          toDate: endDate,
          numDays,
          medicines: calculatedMedicines,
          finalCost: parseFloat(finalCost.toFixed(2)),
        },
      },
      { new: true, upsert: true }
    );

    console.log(
      `Calculation upserted for user ${userId} with ID: ${calculation._id}`
    );

    // ✅ Return calculation result with additional details for display
    return NextResponse.json(
      {
        success: true,
        data: {
          _id: calculation._id,
          userId,
          fromDate: calculation.fromDate.toISOString(),
          toDate: calculation.toISOString
            ? calculation.toISOString()
            : calculation.toDate.toISOString(),
          numDays: calculation.numDays,
          medicines: calculatedMedicines.map((m, idx) => ({
            ...m,
            medicineId: m.medicineId.toString(),
            pricePerUnit: medicines[idx].pricePerUnit,
            quantityPerDose: medicines[idx].quantityPerDose,
          })),
          finalCost: parseFloat(finalCost.toFixed(2)),
          createdAt: calculation.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error in /api/Calculate:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
