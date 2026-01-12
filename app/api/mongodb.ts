import mongoose from "mongoose";

export async function connectDB() {
  try {
    if (!process.env.DB) throw new Error("No DB connection string found");
    await mongoose.connect(process.env.DB);
    console.log("MongoDB connected...");
  } catch (error) {
    console.error(error);
    throw new Error("DB Connection Failed");
  } finally {
    console.log("DB Process Finished.");
  }
}
