// models/Prescription.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export type FrequencyUnit = "DAY" | "WEEK" | "MONTH";
export type WeekdayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface MedicineSubdoc {
  medicineId: string;
  medicineName: string;
  dosage: number;
  frequency: number;
  frequencyUnit: FrequencyUnit;
  doseTimes: string[];

  // NEW
  weeklyDays?: WeekdayCode[];   // for WEEK
  monthlyDates?: number[];      // for MONTH
}

export interface PrescriptionDoc extends Document {
  userId: string;
  startDate: Date;
  endDate: Date;
  medicines: MedicineSubdoc[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<MedicineSubdoc>(
  {
    medicineId: { type: String, required: true },
    medicineName: { type: String, required: true },
    dosage: { type: Number, required: true },
    frequency: { type: Number, required: true },
    frequencyUnit: {
      type: String,
      enum: ["DAY", "WEEK", "MONTH"],
      required: true,
    },
    doseTimes: { type: [String], default: [] },

    weeklyDays: [{ type: String, enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] }],
    monthlyDates: [{ type: Number, min: 1, max: 31 }],
  },
  { _id: false }
);

const prescriptionSchema = new Schema<PrescriptionDoc>(
  {
    userId: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    medicines: {
      type: [medicineSchema],
      required: true,
      validate: {
        validator: (v: MedicineSubdoc[]) => Array.isArray(v) && v.length > 0,
        message: "At least one medicine is required",
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Prescription: Model<PrescriptionDoc> =
  mongoose.models.Prescription ||
  mongoose.model<PrescriptionDoc>("Prescription", prescriptionSchema);

export default Prescription;
