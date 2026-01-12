import mongoose, { Schema, models } from "mongoose";

const medicineSchema = new Schema({
  id: { type: String },
  name: { type: String, required: true },
  "price(₹)": { type: String }, // ✅ Match actual database field name
  Is_discontinued: { type: String }, // ✅ Match actual field (capital I)
  manufacturer_name: { type: String, required: true },
  type: {
    type: String,
    enum: ["allopathy", "ayurvedic", "homeopathy"],
    required: true,
  },
  pack_size_label: { type: String, required: true },
  short_composition1: { type: String, required: true },
  short_composition2: { type: String }, // ✅ Added this field
});

const medicine = models.medicine || mongoose.model("medicine", medicineSchema);
export default medicine;