// app/api/add_prescription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import z from "zod";
import Prescription from "@/models/Prescription";

const medicineSchema = z.object({
  medicineId: z.string(),
  medicineName: z.string(),
  dosage: z.number(),
  frequency: z.number(),
  frequencyUnit: z.enum(["DAY", "WEEK", "MONTH"]),
  doseTimes: z.array(z.string()).optional(),

  // NEW
  weeklyDays: z.array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])).optional(),
  monthlyDates: z.array(z.number().int().min(1).max(31)).optional(),
});

const reqSchema = z.object({
  userId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  medicines: z.array(medicineSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const parsedBody = reqSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsedBody.error },
        { status: 400 }
      );
    }

    const { userId, startDate, endDate, medicines } = parsedBody.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return NextResponse.json(
        { error: "Invalid start or end date" },
        { status: 400 }
      );
    }

    const newPrescription = new Prescription({
      userId,
      startDate: start,
      endDate: end,
      medicines: medicines.map((m) => ({
        medicineId: m.medicineId,
        medicineName: m.medicineName,
        dosage: m.dosage,
        frequency: m.frequency,
        frequencyUnit: m.frequencyUnit,
        doseTimes: m.doseTimes || [],
        weeklyDays: m.weeklyDays || [],
        monthlyDates: m.monthlyDates || [],
      })),
      isActive: true,
    });

    await newPrescription.save();

    return NextResponse.json(
      {
        message: "Prescription created successfully",
        data: newPrescription,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("add_prescription error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
