import mongoose from "mongoose";

export const connectDB = async (uri: string) => {
  try {
    await mongoose.connect(uri, {
    } as mongoose.ConnectOptions);
    console.log("✅ MongoDB connected successfully");
  } catch (err: any) {
    console.error("❌ MongoDB connection failed:", err.message || err);
    throw err;
  }
};
