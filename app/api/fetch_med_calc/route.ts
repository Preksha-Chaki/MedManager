import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/mongodb";
import Calc from "@/models/calc";
import Medicine from "@/models/medicine";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // Trim whitespace/newlines
    userId = userId.trim();

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid userId format" },
        { status: 400 }
      );
    }

    // Find all Calc documents for this user
    const calcs = await Calc.find(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        "medicines.medicineId": 1,
        "medicines.quantity": 1,
        "medicines.cost": 1,
        "medicines.frequency": 1,       // NEW
        "medicines.frequencyUnit": 1,   // NEW
      }
    ).lean();

    // Extract unique medicineIds and map medicineId → { quantity, cost, frequency, frequencyUnit }
    const medicineIdSet = new Set<string>();
    const medicineQuantities = new Map<
      string,
      { quantity: number; cost: number; frequency?: number; frequencyUnit?: string }
    >();

    calcs.forEach((calc: any) => {
      if (Array.isArray(calc.medicines)) {
        calc.medicines.forEach((med: any) => {
          if (med.medicineId) {
            const medId = med.medicineId.toString();
            medicineIdSet.add(medId);

            medicineQuantities.set(medId, {
              quantity: med.quantity,
              cost: med.cost,
              frequency: med.frequency,             // NEW
              frequencyUnit: med.frequencyUnit,     // NEW
            });
          }
        });
      }
    });

    const medicineIds = Array.from(medicineIdSet);

    if (medicineIds.length === 0) {
      return NextResponse.json(
        { success: true, data: [] },
        { status: 200 }
      );
    }

    // ✅ Fetch medicine details with ACTUAL field names from your schema
    const medicines = await Medicine.find(
      { _id: { $in: medicineIds } }
    ).lean();

    // ✅ Combine medicine details with quantity, cost, frequency info from Calc
    const result = medicines.map((med: any) => {
      const quantities = medicineQuantities.get(med._id.toString()) || {
        quantity: 0,
        cost: 0,
        frequency: undefined,
        frequencyUnit: undefined,
      };

      // ✅ Parse price from string field "price(₹)"
      const priceStr = med["price(₹)"];
      const price = priceStr ? parseFloat(priceStr) : null;

      return {
        _id: med._id,
        medicineId: med._id.toString(),
        name: med.name,
        manufacturer_name: med.manufacturer_name,
        pack_size_label: med.pack_size_label,
        price: !isNaN(price as any) ? price : null,
        quantity: quantities.quantity,
        cost: quantities.cost,
        frequency: quantities.frequency,             // NEW
        frequencyUnit: quantities.frequencyUnit,     // NEW
        short_composition1: med.short_composition1,
        short_composition2: med.short_composition2,
        Is_discontinued: med.Is_discontinued,
      };
    });

    console.log("✅ Fetched medicines for calc:", result.length);

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in /api/fetch_med_calc:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
