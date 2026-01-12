// app/api/fetch_prescription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import Prescription from "@/models/Prescription"; // updated model with frequencyUnit, weeklyDays, monthlyDates
import { z } from "zod";

const querySchema = z.object({
  userId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "";

    const parsed = querySchema.safeParse({ userId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid or missing userId" },
        { status: 400 }
      );
    }

    const prescriptions = await Prescription.find({
      userId: parsed.data.userId,
    })
      .sort({ startDate: -1 })
      .lean();

    // Ensure all fields exist on each medicine, even if empty
    const normalized = prescriptions.map((p) => ({
      _id: p._id.toString(),
      userId: p.userId,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      isActive: p.isActive,
      medicines: (p.medicines || []).map((m: any) => ({
        medicineId: m.medicineId,
        medicineName: m.medicineName,
        dosage: m.dosage,
        frequency: m.frequency,
        frequencyUnit: m.frequencyUnit ?? "DAY",
        doseTimes: m.doseTimes || [],
        weeklyDays: m.weeklyDays || [],
        monthlyDates: m.monthlyDates || [],
      })),
    }));

    return NextResponse.json(
      {
        success: true,
        data: normalized,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("fetch_prescription error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
