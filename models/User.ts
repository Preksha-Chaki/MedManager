import mongoose, { Schema, Document, Model } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    allergies: {
      type: [String],
      default: [],
    },

    Phoneno: {
      type: Number,
    },

  }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
