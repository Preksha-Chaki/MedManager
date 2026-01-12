import mongoose from "mongoose";

export type FrequencyUnit = "DAY" | "WEEK" | "MONTH";

const calcSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fromDate: {
    type: Date,
    required: false,
  },
  toDate: {
    type: Date,
    required: false,
  },

  numDays: {
    type: Number,
    required: false,
  },

  medicines: [
    {
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "medicine",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      cost: {
        type: Number,
        required: true,
      },
      frequency: {
        type: Number,
        required: true, // times per unit
      },
      frequencyUnit: {
        type: String,
        enum: ["DAY", "WEEK", "MONTH"],
        required: true,
      },
    },
  ],
  finalCost: {
    type: Number,
    required: false,
  },
});

export default mongoose.models.calc || mongoose.model("calc", calcSchema);
